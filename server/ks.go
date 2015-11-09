package main

import (
	"bytes"
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	jwt "github.com/dgrijalva/jwt-go"
	"github.com/go-martini/martini"
	"github.com/martini-contrib/binding"
	"github.com/martini-contrib/cors"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"io/ioutil"
	"log"
	"net/http"
	"net/smtp"
	"runtime"
	"strings"
	"text/template"
	"time"
)

const (
	REGOSERVER = "www.wargaming.io"
)

// DataTypes for communication
type (
	UserData struct {
		Id        bson.ObjectId `bson:"_id,omitempty" json:"-"` // Never ever encode this field
		Username  string        `form:"username" json:"username"`
		Email     string        `form:"email" json:"email"`
		Password  string        `form:"password" json:"password"`
		Valid     bool          `json:"valid"`
		LoggedIn  bool          `json:"loggedIn"`
		Location  string        `form:"location" json:"location"`
		Lat       float64       `json:"lat"`
		Lng       float64       `json:"lng"`
		Credit    int           `json:"credit"`
		Scale     string        `form:"scale" json:"scale"`
		Armies    string        `form:"armies" json:"armies"`
		GameTime  string        `form:"gametime" json:"gametime"`
		Scenarios int           `json:"scenarios"` // how many scenarios can this user have
		Admin     bool          `json:"admin"`     // how many scenarios can this user have
	}

	TokenData struct {
		Token string
	}

	UpdateUserData struct {
		Token string
		User  UserData
	}

	SubUnit struct {
		Type   string
		Name   string
		Rating int
		Size   int
		Attr   int
	}

	UnitData struct {
		Lat    float32 `json:"lat,omitempty"`
		Lng    float32 `json:"lng,omitempty"`
		Name   string  `json:"name,omitempty"`
		Lvl    string  `json:"lvl,omitempty"`
		Id     string  `json:"id"`
		Parent string  `json:"parent,omitempty"`
		Nation string  `json:"nation"`

		// Extension fields
		// HQ
		// Corps
		Log string `json:"logistics,omitempty"`
		Ini string `json:"initiative,omitempty"`
		Vig string `json:"vigour,omitempty"`

		// Div
		// Bde
		Skl string `json:"skill,omitempty"`

		// SubUnits
		SubUnits []SubUnit `json:"sub"`
	}

	ForceData []UnitData

	ObjectiveData struct {
		Id      int     `json:"id,omitempty"`
		Lat     float32 `json:"lat,omitempty"`
		Lng     float32 `json:"lng,omitempty"`
		Name    string  `json:"name,omitempty"`
		Color   string  `json:"color,omitempty"`
		Connect []int   `json:"connect,omitempty"`
	}

	// Map Request as seen over the wire from the front end
	MapSaveRequest struct {
		Token      string
		Slot       int
		Name       string
		Season     string
		Year       string
		Period     string
		Image      string
		Lat        float32
		Lng        float32
		Zoom       int
		Units      map[string]ForceData
		Obj        []ObjectiveData
		NextUnitId map[string]int
		NextObjId  int
	}

	MapDeleteRequest struct {
		Token string
		Slot  int
	}

	MapLoadRequest struct {
		Token string
		Slot  int
	}

	LookupRequest struct {
		Token string
	}

	ForcesRequest struct {
		Token  string
		Period string
	}

	// Map data, as stored in the database
	MapData struct {
		Id         bson.ObjectId `bson:"_id,omitempty"`
		Owner      bson.ObjectId
		Slot       int
		Name       string
		Season     string
		Year       string
		Period     string
		Image      string
		Date       time.Time
		Lat        float32
		Lng        float32
		Zoom       int
		Units      map[string]ForceData
		Obj        []ObjectiveData
		NextUnitId map[string]int
		NextObjId  int
	}

	PlayerData struct {
		Color string `json:"color"`
		Corps int    `json:"Corps"`
	}

	ScenarioListRequest struct {
		Token string
	}

	SlotData struct {
		Id      bson.ObjectId `bson:"_id,omitempty"`
		Owner   bson.ObjectId
		Slot    int
		Period  string
		Name    string
		Image   string
		Season  string
		Players map[string]PlayerData
	}

	Scenarios        []ScenarioResponse
	ScenarioResponse struct {
		Slot    int
		Period  string
		Name    string
		Image   string
		Season  string
		Players map[string]PlayerData
	}

	// Various Quick Lookup Structs

	Rating struct {
		Id   int `bson:"_id,omitempty"`
		Name string
	}

	Period struct {
		Id   int `bson:"_id,omitempty"`
		Code string
		Name string
		From int
		To   int
		Lat  float32
		Lng  float32
	}

	InfAttr struct {
		Id      int `bson:"_id,omitempty"`
		Name    string
		Desc    string
		Bases   []int
		Ranks   int
		Fire    []int
		Bayonet []int
		Shock   int
		Rifle   int
		Bg      int
		Image   string
	}

	CavAttr struct {
		Id       int `bson:"_id,omitempty"`
		Name     string
		Cr       int
		Sk       int
		Lance    int
		Scout    int
		Cossack  int
		Dismount int
		Image    string
	}

	GunAttr struct {
		Id      int `bson:"_id,omitempty"`
		Name    string
		Desc    string
		Calibre int
		Weight  int
		Horse   int
		HW      int
		Image   string
		Rc      int
		Rs      int
		Rr      int
	}

	CmdAttr struct {
		Id    int `bson:"_id,omitempty"`
		Name  string
		Image string
	}

	ForceTemplate struct {
		Type   string
		Name   string
		Rating int
		Attr   int
		Size   int
	}

	ForceStruct struct {
		Period string
		Nation string
		Flag   string
		Inf    []int
		Div    []ForceTemplate
		Bde    []ForceTemplate
		Cav    []ForceTemplate
		Art    []ForceTemplate
	}

	Lookups struct {
		Ratings []Rating
		Periods []Period
		Infs    []InfAttr
		Cavs    []CavAttr
		Guns    []GunAttr
		Cmds    []CmdAttr
	}

	GameParticipation struct {
		Name       string
		PlayerID   int
		PlayerName string
		Period     string
		Year       int
		Turn       int
	}

	LoginResponse struct {
		Error       string
		TokenString string
		Lookups     Lookups
		Games       []GameParticipation
		Username    string
		Credit      int
		Scenarios   int
		Admin       bool
	}
)

// location of the files used for signing and verification
const (
	privKeyPath = "keys/app.rsa"     // openssl genrsa -out app.rsa keysize
	pubKeyPath  = "keys/app.rsa.pub" // openssl rsa -in app.rsa -pubout > app.rsa.pub
)

// keys are held in global variables
// i havn't seen a memory corruption/info leakage in go yet
// but maybe it's a better idea, just to store the public key in ram?
// and load the signKey on every signing request? depends on your usage i guess
var (
	verifyKey, signKey []byte
)

// read the JWT key files before starting http handlers
func initJWT() {
	var err error

	signKey, err = ioutil.ReadFile(privKeyPath)
	if err != nil {
		log.Fatal("Error reading private key")
		return
	}

	verifyKey, err = ioutil.ReadFile(pubKeyPath)
	if err != nil {
		log.Fatal("Error reading public key")
		return
	}
}

// Catch fatal conditions, and print a stack trace
func catchPanic(err *error, functionName string) {
	if r := recover(); r != nil {
		fmt.Printf("%s : PANIC Defered : %v\n", functionName, r)

		// Capture the stack trace
		buf := make([]byte, 10000)
		runtime.Stack(buf, false)

		fmt.Printf("%s : Stack Trace : %s", functionName, string(buf))

		if err != nil {
			*err = fmt.Errorf("%v", r)
		}
	} else if err != nil && *err != nil {
		fmt.Printf("%s : ERROR : %v\n", functionName, *err)

		// Capture the stack trace
		buf := make([]byte, 10000)
		runtime.Stack(buf, false)

		fmt.Printf("%s : Stack Trace : %s", functionName, string(buf))
	}
}

// Send an email
func SendEmail(subject string, to []string, message string) (err error) {
	defer catchPanic(&err, "SendEmail")

	var host = "mail.nextgenminiatures.com"
	var port = 25
	var userName = "Kriegsspiel Umpire <umpire@nextgenminiatures.com>"
	var password = "unx911zxx"

	parameters := struct {
		From    string
		To      string
		Subject string
		Message string
	}{
		userName,
		strings.Join([]string(to), ","),
		subject,
		message,
	}

	buffer := new(bytes.Buffer)

	template := template.Must(template.New("emailTemplate").Parse(emailScript()))
	template.Execute(buffer, &parameters)

	auth := smtp.PlainAuth("", userName, password, host)

	err = smtp.SendMail(
		fmt.Sprintf("%s:%d", host, port),
		auth,
		userName,
		to,
		buffer.Bytes())

	return err
}

// Template for correctly formatting an email
func emailScript() (script string) {
	return `From: {{.From}}
To: {{.To}}
Subject: {{.Subject}}
MIME-version: 1.0
Content-Type: text/html; charset="UTF-8"

{{.Message}}`
}

// Init MongoDB
func DB() martini.Handler {
	session, err := mgo.Dial("mongodb://localhost") // mongodb://localhost
	if err != nil {
		panic(err)
	}

	db := session.DB("kriegsspiel")
	// Ensure some indexes whilst we are here
	db.C("users").EnsureIndexKey("email")
	db.C("maps").EnsureIndexKey("owner", "slot")
	db.C("slots").EnsureIndexKey("owner", "slot")

	return func(c martini.Context) {
		s := session.Clone()
		c.Map(db)
		defer s.Close()
		c.Next()
	}
}

// Get the MD5 hash of a string, in HEX format
func GetMD5HexHash(text string) string {
	hash := md5.Sum([]byte(text))
	return hex.EncodeToString(hash[:])
}

// Send a registration email for a given user
func sendRegoEmail(user UserData) {

	msg, err := ioutil.ReadFile("regomail.txt")
	if err != nil {
		log.Println(err)
	}

	parameters := struct {
		Server        string
		ValidationKey string
	}{
		REGOSERVER,
		GetMD5HexHash(user.Email + user.Password),
	}

	buffer := new(bytes.Buffer)

	template := template.Must(template.New("regoTemplate").Parse(string(msg)))
	template.Execute(buffer, &parameters)

	fmtMsg := buffer.String()

	err = SendEmail("Welcome to the Kriegsspiel Server",
		[]string{user.Email},
		fmtMsg)

	if err != nil {
		log.Fatal(err)
	}
	log.Println("Sent registration email to ", user.Email)
}

// Validate the user, based on the key passed in as a param
// USAGE:   GET  /validate/:key
// The value in :key is an MD5 hash of the username and password together
// So ... this function needs to find all unvalidated users in the
// user collection of the database, compute the MD5 hash, and compare
// it to the key.
// Return Value:
// - If :key matches, then set the user to valid, and return 200, Email Address
// - Else 404, Not Found
func validateUser(db *mgo.Database, params martini.Params) (int, string) {
	users := db.C("users")

	var foundUsers []UserData
	key := params["key"]

	users.Find(bson.M{"valid": false}).
		Select(bson.M{"email": true, "password": true}).
		All(&foundUsers)

	for _, user := range foundUsers {
		hash := GetMD5HexHash(user.Email + user.Password)
		log.Println(user, hash)
		if hash == key {
			// All good, so set them to validated,
			// Give them 10 free credits, and 2 free slots to start off with
			err := users.UpdateId(user.Id,
				bson.M{"$set": bson.M{"valid": true,
					"credit":    10,
					"scenarios": 8}})
			if err != nil {
				log.Println(err)
			} else {
				return 201, user.Email
			}

			// Now create the starter slots for this user
		}
	}

	return 404, "Not Found"
}

// Validate the received security token
// If good, return the UserID
func securityCheck(db *mgo.Database, passedToken string) (int, string, bson.ObjectId) {
	// validate the token

	//log.Println("Security Check:", passedToken)
	token, err := jwt.Parse(passedToken, func(token *jwt.Token) (interface{}, error) {
		// since we only use the one private key to sign the tokens,
		// we also only use its public counter part to verify
		return signKey, nil
	})

	// branch out into the possible error from signing
	switch err.(type) {

	case nil: // no error

		if !token.Valid { // but may still be invalid
			log.Println("Invalid Token", passedToken)
			return http.StatusUnauthorized, err.Error(), ""
		}

		log.Printf("Token OK:%+v\n", token.Claims)
		return http.StatusOK, "Token Valid", bson.ObjectIdHex(token.Claims["User"].(string))

	case *jwt.ValidationError: // something was wrong during the validation
		vErr := err.(*jwt.ValidationError)

		switch vErr.Errors {
		case jwt.ValidationErrorExpired:
			return http.StatusUnauthorized, err.Error(), ""

		default:
			return http.StatusUnauthorized, "Invalid Token!", ""
		}

	default: // something else went wrong
		log.Printf("Token parse error: %v\n", err)
		return http.StatusUnauthorized, "Invalid Token!", ""
	}
}

// For a given period code, return the internally used PeriodID
func decodePeriod(db *mgo.Database, code string) int {
	var myPeriod Period
	err := db.C("period").Find(bson.M{"code": code}).One(&myPeriod)
	if err != nil {
		return -1
	}
	return myPeriod.Id
}

// Attempt to login with the given email and password
// Returns :
// 404 - If the user does not exist at all.
// 200 - If the user and password match, and the account is verified. Return a JWT token
// 402 - If the user and password match, but account is awaiting validation
// 401 - If the user is valid, but the password is wrong
// 400 - If the email or password is invalid
func login(db *mgo.Database, user UserData) (int, string) {

	log.Println("login(" + user.Email + "," + user.Password + ")")
	var retval LoginResponse

	// Do some trivial checking on the email and password before processing
	if !strings.Contains(user.Email, "@") || !strings.Contains(user.Email, ".") {
		log.Println(user.Email, "has no @ or .")
		return 400, "Invalid Email Address"
	}
	if len(user.Password) < 1 {
		log.Println("Empty Password")
		return 400, "Empty Password"
	}

	var foundUser UserData
	err := db.C("users").Find(bson.M{"email": user.Email}).One(&foundUser)
	if err != nil {
		return http.StatusNotFound, "Invalid Login Details"
	}

	if foundUser.Password == user.Password {
		// Correct login code, return depending on whether the account is validated yet
		if foundUser.Valid {
			// create a signer for rsa 256
			t := jwt.New(jwt.GetSigningMethod("HS256"))

			// set our claims
			t.Claims["User"] = foundUser.Id

			// set the expire time for 14 days
			// see http://tools.ietf.org/html/draft-ietf-oauth-json-web-token-20#section-4.1.4
			t.Claims["exp"] = time.Now().Add(time.Hour * 24 * 14).Unix()
			tokenString, err := t.SignedString(signKey)
			if err != nil {
				log.Println(t, tokenString, err, err.Error())
				return http.StatusInternalServerError, "Error signing token"
			}

			// Make up a response that includes :
			// A new valid token
			// Lookup data

			retval.TokenString = tokenString
			retval.Error = ""
			retval.Lookups = getLookupData(db)
			retval.Games = make([]GameParticipation, 0, 8)
			retval.Username = foundUser.Username
			retval.Credit = foundUser.Credit
			retval.Scenarios = foundUser.Scenarios
			retval.Admin = foundUser.Admin

			// Now we just return the data that we loaded
			jsonData, err := json.Marshal(retval)
			if err != nil {
				log.Println(err)
				return http.StatusInternalServerError, err.Error()
			}

			return http.StatusOK, string(jsonData)
		} else {
			return http.StatusPaymentRequired, "Please validate your account first (check your email for validation code)"
		}
	} else {
		return http.StatusUnauthorized, "Incorrect Email/Password"
	}
	return http.StatusNotFound, "Not Found"
}

// Register a new user, and store their preferences against their account
// Returns :
// 200 - New account created
// 400 - If the email or password is invalid
// 403 - The email already exists on the system, so you cant register this as new
func registerUser(db *mgo.Database, user UserData) (int, string) {

	log.Println("register(", user, ")")

	// Do some trivial checking on the email and password before processing
	if !strings.Contains(user.Email, "@") || !strings.Contains(user.Email, ".") {
		log.Println(user.Email, "has no @ or .")
		return http.StatusBadRequest, "Invalid Email Address"
	}
	if len(user.Password) < 1 {
		log.Println("Empty Password")
		return http.StatusBadRequest, "Empty Password"
	}

	usersDB := db.C("users")

	// Check that the email is not already in use !!
	cnt, _ := usersDB.Find(bson.M{"email": user.Email, "valid": true}).Count()
	if cnt > 0 {
		return http.StatusForbidden, "This email is already registered"
	}

	// Enforce default fields in the new account
	// This prevents sneaky people trying to register with
	// bonus credit, or bypassing the validation steps, or whatever else
	user.Credit = 0
	user.Valid = false
	user.LoggedIn = false
	user.Scenarios = 0

	// If there is a record for this email, but it is not validated yet
	// .. then allow it to be updated, and generate a new validation key
	var UnvalidatedUser UserData
	err := usersDB.Find(bson.M{"email": user.Email, "valid": false}).One(&UnvalidatedUser)
	if err != nil {
		// Create a new user account
		log.Println("Generate NEW user account for ", user.Email)
		err = usersDB.Insert(user)
		if err != nil {
			return http.StatusBadRequest, err.Error()
		}
	} else {
		// Overwrite the existing unvalidated user account
		log.Println("Update details for unvalidated account ", user.Email)
		err = usersDB.UpdateId(UnvalidatedUser.Id,
			bson.M{"$set": bson.M{
				"email":    user.Email,
				"password": user.Password,
				"location": user.Location,
				"scale":    user.Scale,
				"armies":   user.Armies,
				"gametime": user.GameTime},
			})
		if err != nil {
			return http.StatusBadRequest, err.Error()
		}

	}

	go sendRegoEmail(user)
	return http.StatusOK, "New Account Registered"
}

// Update user details
func updateUser(db *mgo.Database, update UpdateUserData) (int, string) {

	log.Println("updateUser(", update, ")")

	user := update.User
	if len(user.Password) < 1 {
		log.Println("Empty Password")
		return http.StatusBadRequest, "Empty Password"
	}

	// Check that the passed token is valid
	scode, sdesc, userID := securityCheck(db, update.Token)
	if scode != http.StatusOK {
		return scode, sdesc
	}

	// Update the user now !
	err := db.C("users").UpdateId(userID,
		bson.M{"$set": bson.M{
			"username": user.Username,
			"password": user.Password,
			"location": user.Location,
			"scale":    user.Scale,
			"armies":   user.Armies,
			"gametime": user.GameTime},
		})
	if err != nil {
		return http.StatusBadRequest, err.Error()
	}

	return http.StatusOK, "Account Details Updated"
}

// Get user details
func getUser(db *mgo.Database, token TokenData) (int, string) {

	log.Println("getUser(", token, ")")

	// Check that the passed token is valid
	scode, sdesc, userID := securityCheck(db, token.Token)
	if scode != http.StatusOK {
		return scode, sdesc
	}

	var myUser UserData
	err := db.C("users").FindId(userID).One(&myUser)
	if err != nil {
		return http.StatusNotFound, err.Error()
	}

	encodedUser, eerr := json.Marshal(myUser)
	if eerr != nil {
		return http.StatusBadRequest, eerr.Error()
	}
	return http.StatusOK, string(encodedUser)
}

// Forgot password
// Returns :
// 200 - Password reminder sent
// 400 - If the email or password is invalid
// 404 - The user does not exist
func forgotPassword(db *mgo.Database, user UserData) (int, string) {

	log.Println("forgot(", user, ")")

	// Do some trivial checking on the email and password before processing
	if !strings.Contains(user.Email, "@") || !strings.Contains(user.Email, ".") {
		log.Println(user.Email, "has no @ or .")
		return http.StatusBadRequest, "Invalid Email Address"
	}

	// Get the user record
	q := db.C("users").Find(bson.M{"email": user.Email})
	cnt, err := q.Count()
	if cnt < 1 {
		return http.StatusNotFound, "Unknown Email Address"
	}

	err = q.One(&user)
	if err != nil {
		log.Println(err)
		return http.StatusBadRequest, err.Error()
	}

	msg := fmt.Sprintf("Your password is ....\n<br>\n<br>\n<br>\n<br>%s", user.Password)
	go SendEmail("Kriegsspiel Password Reminder",
		[]string{user.Email},
		msg)

	return http.StatusOK, "Password Reminder Sent"
}

// Delete a map object and clear the slot
func deleteMap(db *mgo.Database, mapReq MapDeleteRequest) (int, string) {
	log.Println(mapReq)

	// Check that the passed token is valid
	scode, sdesc, userID := securityCheck(db, mapReq.Token)
	if scode != http.StatusOK {
		return scode, sdesc
	}

	var myUser UserData
	err := db.C("users").FindId(userID).One(&myUser)
	if err != nil {
		return http.StatusNotFound, err.Error()
	}

	// Check that the slot is within the valid range for this user
	if mapReq.Slot > myUser.Scenarios {
		return http.StatusForbidden, "Invalid Slot ID for this user"
	}

	// Ruthlessly purge any existing maps and slots to make room
	purgeSlot(db, userID, mapReq.Slot)

	return http.StatusOK, fmt.Sprintf("Slot %d has been cleared", mapReq.Slot)
}

// Save a map object
func saveMap(db *mgo.Database, mapReq MapSaveRequest) (int, string) {
	log.Println(mapReq)

	// Check that the passed token is valid
	scode, sdesc, userID := securityCheck(db, mapReq.Token)
	if scode != http.StatusOK {
		return scode, sdesc
	}

	var myUser UserData
	err := db.C("users").FindId(userID).One(&myUser)
	if err != nil {
		return http.StatusNotFound, err.Error()
	}

	// Check that the slot is within the valid range for this user
	if mapReq.Slot > myUser.Scenarios {
		return http.StatusForbidden, "Invalid Slot ID for this user"
	}

	// Ruthlessly purge any existing maps and slots to make room
	purgeSlot(db, userID, mapReq.Slot)

	// Now we can construct the saved map object
	var myMap MapData
	myMap.Id = bson.NewObjectId()
	myMap.Owner = myUser.Id
	myMap.Slot = mapReq.Slot
	myMap.Name = mapReq.Name
	myMap.Season = mapReq.Season
	myMap.Year = mapReq.Year
	myMap.Period = mapReq.Period
	myMap.Image = mapReq.Image
	myMap.Lat = mapReq.Lat
	myMap.Lng = mapReq.Lng
	myMap.Zoom = mapReq.Zoom
	myMap.Units = mapReq.Units
	myMap.Obj = mapReq.Obj
	myMap.Date = time.Now()
	myMap.NextUnitId = mapReq.NextUnitId
	myMap.NextObjId = mapReq.NextObjId

	log.Println("received map with period", mapReq.Period)

	// Add the map itself
	err = db.C("maps").Insert(myMap)
	if err != nil {
		log.Println(err)
		return http.StatusInternalServerError, err.Error()
	}

	// Construct the players derived info to add to the slot
	// xcxcxc

	players := make(map[string]PlayerData)
	for forceColor, forces := range mapReq.Units {
		for _, unit := range forces {
			log.Println("Unit", forceColor, unit)
			switch unit.Lvl {
			case "HQ":
				// Now - go through and get ALL Corps for this player
				var numCorps = 0
				for _, corpsUnit := range forces {
					if corpsUnit.Parent == unit.Id {
						numCorps++
					}
				}
				players[unit.Name] = PlayerData{
					Color: forceColor,
					Corps: numCorps,
				}
				break
			}
		}
	}
	log.Println(players)

	// Add a Slot record for this user
	err = db.C("slots").Insert(SlotData{
		bson.NewObjectId(),
		myUser.Id,
		mapReq.Slot,
		mapReq.Period,
		mapReq.Name,
		mapReq.Image,
		mapReq.Season,
		players})
	if err != nil {
		log.Println(err)
		return http.StatusInternalServerError, err.Error()
	}

	return http.StatusOK, "Map Saved as '" + mapReq.Name + "'"
}

// Load a map object
func loadMap(db *mgo.Database, mapReq MapLoadRequest) (int, string) {
	log.Println("load request", mapReq)

	// Check that the passed token is valid
	scode, sdesc, userID := securityCheck(db, mapReq.Token)
	if scode != http.StatusOK {
		return scode, sdesc
	}

	var myUser UserData
	err := db.C("users").FindId(userID).One(&myUser)
	if err != nil {
		return http.StatusNotFound, err.Error()
	}

	// Check that the slot is within the valid range for this user
	if mapReq.Slot > myUser.Scenarios {
		return http.StatusForbidden, "Invalid Slot ID for this user"
	}

	// Now we can load the stored map object
	var myMap MapData
	err = db.C("maps").
		Find(bson.M{"owner": myUser.Id, "slot": mapReq.Slot}).
		One(&myMap)

	if err != nil {
		log.Println(err)
		return http.StatusNotFound, err.Error()
	}

	// Now we just return the map that we loaded
	encodedMap, err := json.Marshal(myMap)
	if err != nil {
		log.Println(err)
		return http.StatusInternalServerError, err.Error()
	}
	return http.StatusOK, string(encodedMap)
}

// Get a list of slots for this user
func scenarioList(db *mgo.Database, slr ScenarioListRequest) (int, string) {
	log.Println("Scenario List Request", slr)

	// Decode the token
	scode, sdesc, userID := securityCheck(db, slr.Token)
	if scode != http.StatusOK {
		return scode, sdesc
	}

	var myUser UserData
	err := db.C("users").FindId(userID).One(&myUser)
	if err != nil {
		return http.StatusNotFound, err.Error()
	}

	// All good, now get an array of slotData and return this
	slots := make(Scenarios, 0, myUser.Scenarios)

	err = db.C("slots").
		Find(bson.M{"owner": userID}).
		Sort("slot").
		All(&slots)

	if err != nil {
		return http.StatusNotFound, err.Error()
	}

	// Now we just return the slots that we loaded
	jsonSlots, err := json.Marshal(slots)
	if err != nil {
		log.Println(err)
		return http.StatusInternalServerError, err.Error()
	}

	return http.StatusOK, string(jsonSlots)
}

// Clear out the given slot for the user, and remove any other records
// associated with this slot
func purgeSlot(db *mgo.Database, Owner bson.ObjectId, Slot int) {

	// Find the existing one
	var mySlot SlotData
	err := db.C("slots").Find(bson.M{"owner": Owner, "slot": Slot}).One(&mySlot)
	if err != nil {
		log.Println(err)
		return
	}

	// Remove the Slot
	err = db.C("slots").RemoveId(mySlot.Id)
	if err != nil {
		log.Println("Problem removing slot", err)
	}

	// remove associated records
	info, derr := db.C("maps").RemoveAll(bson.M{
		"owner": Owner,
		"slot":  Slot})
	log.Println(info)
	if derr != nil {
		log.Println("Problem removing map", derr)
	}
}

// get a big set of lookups
func lookups(db *mgo.Database, l LookupRequest) (int, string) {

	log.Println("Lookups Request")

	// Decode the token
	scode, sdesc, _ := securityCheck(db, l.Token)
	if scode != http.StatusOK {
		return scode, sdesc
	}

	myLookups := getLookupData(db)

	// Now we just return the data that we loaded
	jsonData, err := json.Marshal(myLookups)
	if err != nil {
		log.Println(err)
		return http.StatusInternalServerError, err.Error()
	}

	return http.StatusOK, string(jsonData)
}

// Get lookup data
func getLookupData(db *mgo.Database) Lookups {

	log.Println("Constructing Lookup Object")

	var myLookups Lookups

	// All good, now get an array of different lookup tables
	db.C("period").Find(bson.M{}).Sort("_id").All(&myLookups.Periods)
	db.C("rating").Find(bson.M{}).Sort("-_id").All(&myLookups.Ratings)
	db.C("infantry").Find(bson.M{}).Sort("_id").All(&myLookups.Infs)
	db.C("cav").Find(bson.M{}).Sort("_id").All(&myLookups.Cavs)
	db.C("gun").Find(bson.M{}).Sort("_id").All(&myLookups.Guns)
	db.C("cmd").Find(bson.M{}).Sort("_id").All(&myLookups.Cmds)

	return myLookups
}

// get a set of forces for the given period
func getForces(db *mgo.Database, f ForcesRequest) (int, string) {

	log.Println("Forces Request", f.Period)

	// Decode the token
	scode, sdesc, _ := securityCheck(db, f.Token)
	if scode != http.StatusOK {
		return scode, sdesc
	}

	var myForces []ForceStruct

	// All good, now get an array of different lookup tables
	err := db.C("force").Find(bson.M{"period": f.Period}).Sort("_id").All(&myForces)

	log.Println(myForces)

	// Now we just return the data that we loaded
	jsonData, err := json.Marshal(myForces)
	if err != nil {
		log.Println(err)
		return http.StatusInternalServerError, err.Error()
	}

	return http.StatusOK, string(jsonData)
}

// Main function
func main() {
	log.Println("Kriegspiel Registration Server")

	initJWT()

	m := martini.Classic()

	m.Use(cors.Allow(&cors.Options{
		AllowOrigins: []string{"*"},
	}))

	m.Use(DB())

	// Login request - either accept or fail
	m.Post("/login", binding.Bind(UserData{}), func(db *mgo.Database, user UserData) (int, string) {
		return login(db, user)
	})

	// Register new account
	m.Post("/register", binding.Bind(UserData{}), func(db *mgo.Database, user UserData) (int, string) {
		return registerUser(db, user)
	})
	// Update account details
	m.Post("/updateuser", binding.Bind(UpdateUserData{}), func(db *mgo.Database, user UpdateUserData) (int, string) {
		return updateUser(db, user)
	})
	// Get the user account details
	m.Post("/getuser", binding.Bind(TokenData{}), func(db *mgo.Database, token TokenData) (int, string) {
		return getUser(db, token)
	})

	// Forgot Password
	m.Post("/forgot", binding.Bind(UserData{}), func(db *mgo.Database, user UserData) (int, string) {
		return forgotPassword(db, user)
	})

	// Test Token
	m.Post("/token", binding.Bind(TokenData{}), func(db *mgo.Database, t TokenData) (int, string) {
		status, desc, _ := securityCheck(db, t.Token)
		return status, desc
	})

	// Save a map
	m.Post("/savemap", binding.Bind(MapSaveRequest{}), func(db *mgo.Database, mapReq MapSaveRequest) (int, string) {
		return saveMap(db, mapReq)
	})

	// Delete a map
	m.Post("/deletemap", binding.Bind(MapDeleteRequest{}), func(db *mgo.Database, mapDelReq MapDeleteRequest) (int, string) {
		return deleteMap(db, mapDelReq)
	})

	// Load a map
	m.Post("/loadmap", binding.Bind(MapLoadRequest{}), func(db *mgo.Database, mapReq MapLoadRequest) (int, string) {
		return loadMap(db, mapReq)
	})

	// Get a list of scenarios
	m.Post("/scenarios", binding.Bind(ScenarioListRequest{}), func(db *mgo.Database, slr ScenarioListRequest) (int, string) {
		return scenarioList(db, slr)
	})

	// Get a set of lookup values
	m.Post("/lookups", binding.Bind(LookupRequest{}), func(db *mgo.Database, l LookupRequest) (int, string) {
		return lookups(db, l)
	})

	// Get a set of forces for the given period
	m.Post("/forces", binding.Bind(ForcesRequest{}), func(db *mgo.Database, f ForcesRequest) (int, string) {
		return getForces(db, f)
	})

	// Validate an account
	m.Get("/validate/:key", func(db *mgo.Database, params martini.Params) (int, string) {
		retval, resultStr := validateUser(db, params)
		if retval >= http.StatusBadRequest {
			log.Println("Error Validating User:", resultStr)
			return retval, resultStr
		} else {
			log.Println("Validated ", resultStr)
			return retval, "Thanks " + resultStr + ", your account has now been validated, and you can start playing !!"
		}
	})
	m.Use(martini.Static("app"))
	m.RunOnAddr(":8231")
}
