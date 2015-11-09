package main

import (
	"bytes"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"github.com/HouzuoGuo/tiedot/db"
	"github.com/go-martini/martini"
	"github.com/martini-contrib/binding"
	"github.com/martini-contrib/cors"
	"log"
	"net/smtp"
	"strings"
)

type UserData struct {
	Email    string  `form:"email" json:"Email"`
	Password string  `form:"password" json:"Password"`
	Valid    bool    `json:"Valid"`
	LoggedIn bool    `json:"LoggedIn"`
	Location string  `form:"Location" json:"location"`
	Lat      float64 `json:"Lat"`
	Lng      float64 `json:"Lng"`
	Credit   int     `json:"Credit"`
	Scale    string  `form:"scale" json:"Scale"`
	Armies   string  `form:"armies" json:"Armies"`
	GameTime string  `form:"gametime" json:"GameTime"`
}

type dbRow map[string]interface{}

// Setup the database connection
func initDB() *db.Col {
	// (Create if not exist) open a database
	myDB, err := db.OpenDB("database")
	if err != nil {
		log.Println("Opening existing database")
	} else {
		log.Println("Creating new database")
	}

	// Create two collections: Feeds and Votes
	if err := myDB.Create("Users"); err != nil {
		log.Println("Using existing users database")
	} else {
		log.Println("Using fresh new users database")
	}

	users := myDB.Use("Users")
	if err := users.Index([]string{"Email"}); err != nil {
		log.Println("Using existing email index on users")
	} else {
		log.Println("Creating new index on email field of users database")
	}

	// Add a random user or 2
	//	users.Insert(dbRow{"Email": "jack@sprat.com", "Password": "abc123"})

	return users
}

// Lookup the user record for the given email address
func lookupUser(users *db.Col, email string) dbRow {

	var query interface{}

	queryStr := `{"eq": "` + email + `", "in": ["Email"]}`
	json.Unmarshal([]byte(queryStr), &query)
	queryResult := make(map[int]struct{})

	if err := db.EvalQuery(query, users, &queryResult); err != nil {
		panic(err)
	}

	for id := range queryResult {
		results, err := users.Read(id)
		if err != nil {
			panic(err)
		}
		return results
	}
	return nil
}

// Create a new user record
func createUser(users *db.Col, user UserData) (int, string) {

	// Do some trivial checking on the email and password before processing
	if !strings.Contains(user.Email, "@") || !strings.Contains(user.Email, ".") {
		log.Println(user.Email, "has no @ or .")
		return 403, "Invalid Email Address"
	}
	if len(user.Password) < 1 {
		log.Println("Empty Password")
		return 403, "Empty Password"
	}

	_, err := users.Insert(map[string]interface{}{
		"Email":    user.Email,
		"Password": user.Password,
		"Valid":    false,
		"LoggedIn": false,
		"Location": user.Location,
		"Credit":   0,
		"Scale":    user.Scale,
		"Armies":   user.Armies,
		"GameTime": user.GameTime,
	})
	if err != nil {
		panic(err)
	}

	log.Println("Registering User:", user.Email)
	return 202, "Added User"
}

// Create a new user record
func validateUser(users *db.Col, params martini.Params) (int, string) {

	var user UserData
	retval := 404
	resultStr := "Not Found"
	theId := 0

	// Check each user for a match
	users.ForEachDoc(func(id int, userContent []byte) (willMoveOn bool) {
		json.Unmarshal(userContent, &user)
		if !user.Valid {
			checksum := fmt.Sprintf("%x", md5.Sum([]byte(user.Email+user.Password)))
			if checksum == params["key"] {
				retval = 202
				resultStr = user.Email
				theId = id
			}
			return false // dont process any more records, as we found the right one
		}
		return true // process the next record
	})

	// Update the record here, to avoid deadlock waiting for lock mutex on table
	if retval == 202 {
		// Now update the user record
		var newRow dbRow

		user.Valid = true
		jsonUser, err := json.Marshal(user)
		json.Unmarshal(jsonUser, &newRow)
		err = users.Update(theId, newRow)
		if err != nil {
			panic(err)
		}
	}
	return retval, resultStr
}

// Forgot password - send reminder email
func forgotPassword(users *db.Col, user UserData) (int, string) {

	msg := `Subject: Kriegspiel Server Password Reminder
MIME-version: 1.0
Content-Type: text/html; charset="UTF-8"
<h4>Password Reminder</h4>`

	// Do some trivial checking on the email and password before processing
	if !strings.Contains(user.Email, "@") || !strings.Contains(user.Email, ".") {
		log.Println(user.Email, "has no @ or .")
		return 403, "Invalid Email Address"
	}

	foundUser := lookupUser(users, user.Email)
	if foundUser != nil {

		msg += fmt.Sprintf("%s", foundUser["Password"])

		// Connect to the remote SMTP server.
		c, err := smtp.Dial("localhost:25")
		if err != nil {
			log.Fatal(err)
		}
		log.Println("Connected to mail server")
		// Set the sender and recipient.
		//c.Auth(auth)
		if err = c.Mail("steve@nextgenminiatures.com"); err != nil {
			log.Fatal(err)
		}
		if err = c.Rcpt(user.Email); err != nil {
			log.Fatal(err)
		}
		// Send the email body.
		wc, err := c.Data()
		if err != nil {
			log.Fatal(err)
		}
		defer wc.Close()
		buf := bytes.NewBufferString(msg + "\r\n.\r\n")
		if _, err = buf.WriteTo(wc); err != nil {
			log.Fatal(err)
		}
		log.Println("Delivered message")
		return 200, "OK"
	} else {
		log.Println("Could not find user:", user.Email)
		return 404, "User Not Found"
	}
}

// Send email to user
func sendRegoEmail(user UserData) {

	key := fmt.Sprintf("%x", md5.Sum([]byte(user.Email+user.Password)))

	msg := `Subject: Welcome to the Kriegspiel Server
MIME-version: 1.0
Content-Type: text/html; charset="UTF-8"
<h2>Thanks for registering with NextGenMiniatures online Kriegspiel server !!</h2>
<p>
<center><img src=http://nextgenminiatures.com/ksmailimg/ksheader.jpg>
	<br><small>A game for the discerning professional.</small>
</center>
<p>

<h4>What is this all about then ?</h4>

This is a free account that allows you to get started playing computer moderated wargames campaigns
either solo, or with a group of like minded friends.

<p>

Before you can play though, we need to validate your email address, which you can do by clicking this link below :<p>
<a href=http://192.168.1.102:8230/validate/` + key + `>http://rego.nextgenminiatures.com/validate/` + key + `</a>

<p>
<h4>Tell me more ?</h4>

The purpose of the system is to allow a group of players to re-enact major campaigns of the horse and musket
era, performing all of the grand strategic moves whilst online (eg- from home or work !!), setting up a number of
detailed tabletop actions for the weekends.

<p>

As opposing Division and Corps sized forces contact each other on the campaign map, the Kriegspiel Server determines what happens
based on a number of factors and the orders assigned to each unit. This includes all the boring bits such as the initial scouting
contacts, deployments, probing attacks, defensive preparations, minor losses due to attrition, etc.  

<p>

Information is conveyed back to YOU the commander. The players decide where to make a stand, when to launch a big push, and whether 
or not to draw their opponents into a trap.

<p>
<center><img src=http://nextgenminiatures.com/ksmailimg/ksmap.jpg>
	<br><small>Operational planning and execution of orders<br>Do it all online, at home or work.</small>
</center>

<p>

When the players decide to give battle, then play is transferred to the tabletop with traditional miniatures for the grand tactical
level battle.  This is a miniatures battle like no other though - as the Kriegspiel Server acts as an impartial umpire for the 
tabletop action, as well as doing all the tedious bookkeeping for the game itself.  

<p>

<h4>How do the Tabletop games play out ?</h4>

Combat resolution rules are based upon the original Kriegspiel system developed by professional officers in the Prussian army 
(ie - Original Reisswitz system of 1824 + the revised 1828 additions). This is a game of command and tactics, with a sound scientific and
practical basis backed with plenty of real world experience by the same people that fought in the actual battles of the period.

<p>

In other words .... the 1828 Kriegspiel rules are not a bad
starting point at all, and hard to argue with the logic behind them given their fine credentials.

<p>

The Tabletop Action is intended to tick all the right boxes :
<ul>
	<li> Real Fog of War and hidden movement.
	<li> BIG Tables, BIG armies, lots of miniatures fighting it out on beautiful terrain boards.
	<li> PAIN FREE adaption of figure scales, basing and ground scales between games.
	<li> REALISTIC Command and Control system.
	<li> DETAILED  Drill, Formations, Skirmishing, Morale, Fatigue, Ammunition, Smoke, Unit Cohesion, Leadership, Wounds and Deaths down to the per-soldier level.
	<li> FAST Action - 2-3 hours of fast and furious tabletop action to reach a definitive conclusion for a BIG game.
	<li> ALL Players get to play - no need for a designated umpire, as the server does all the boring stuff.  
	<li> IMPARTIAL - An umpire that is always consistent in applying the rules, and cannot be convinced to do otherwise.
	<li> SCALABLE - The game is fully multi user, so gameplay does not melt down when more units are added to the battle.
</ul>

<center>
	<img src=http://nextgenminiatures.com/ksmailimg/kstable.jpg>
	<br><small>Real Miniatures on Real Tabletops</small>
</center>

<p>

At the end of each Tabletop Action, the server can generate a simple AAR for you - complete with a timeline of maps showing
major developments and decisive moments in the course of the Grand Tactical Battle. You can post this AAR straight to your gaming blog, or 
share it with friends via email or social media.


<h4>And its all FREE ?</h4>

YES.
<p>

This FREE account provides enough to keep you gaming for years, including :
<ul>
	<li> Create up to 3 full blown campaign scenarios, with detailed maps and orders of battle.
	<li> Host 1 campaign game at a time, with up to 4 players per game.
	<li> Host 1 tabletop action at a time, with up to 4 players per game.
	<li> Play solo against 1 computer controlled AI opponent.
</ul>

<p>

<h4>Whats not FREE then ?</h4>

Well, in order to make this all worth doing (and to pay the hosting bills), I will be adding some non-free additions in the near future, 
in the form of in-game purchases and credits.  Buying them is entirely optional. Not buying them will not affect your ability to 
keep playing and enjoying the game.  

<p>

One thing I wont be adding, is in-game purchases that give players some advantage over other players. That is a great way
to wreck a good game !  

<p>

Example future in-game purchase options :
<ul>
	<li> Purchase ready made campaigns that you can add to your account.
	<li> Accurate historical OOB's you can load into your campaigns.
	<li> Define your own custom unit types, weapon stats, etc.
	<li> Credits to host additional campaigns, tabletop games, or add extra players to a game.
	<li> Add additional periods to the system  (1870, ACW, Colonial, WW1, etc.)
	<li> Turn on additional layers for a campaign (Diplomacy, Finance, Resource Management, Unit XP, etc)
	<li> Play against a more advanced AI opponent.
</ul>

<p>
So, if that all sounds fine to you, Please click the validation link at the top of this email and start using 
the Kriegspiel server straight away.
<p>

Thanks,<br>
<i><b>Steve OC</b></i><br>
CEO, NextGenMiniatures

`

	// Connect to the remote SMTP server.
	//c, err := smtp.Dial("mail.nextgenminiatures.com:25")
	//if err != nil {
	//log.Fatal(err)
	//}
	//log.Println("Connected to mail server")
	// Set the sender and recipient.
	auth := smtp.PlainAuth("", "steve@nextgenminiatures.com", "unx911zxx", "mail.nextgenminiatures.com")
	to := []string{user.Email}
	if err := smtp.SendMail("mail.nextgenminiatures.com:25", auth, "<steve@nextgenminiatures.com>", to, []byte(msg)); err != nil {
		log.Fatal(err)
	}
	/*
		if err = c.Auth(auth); err != nil {
			log.Fatal(err)
		}
		if err = c.Mail("steve@nextgenminiatures.com"); err != nil {
			log.Fatal(err)
		}
		c.Rcpt(user.Email)
		// Send the email body.
		wc, err := c.Data()
		if err != nil {
			log.Fatal(err)
		}
		defer wc.Close()
		buf := bytes.NewBufferString(msg + "\r\n.\r\n")
		if _, err = buf.WriteTo(wc); err != nil {
			log.Fatal(err)
		}
	*/
	log.Println("Delivered message")
}

func main() {
	log.Println("Kriegspiel Registration Server")
	m := martini.Classic()

	m.Use(cors.Allow(&cors.Options{
		AllowOrigins: []string{"*"},
	}))

	m.Map(initDB())

	// Login request - either accept or fail
	m.Post("/login", binding.Bind(UserData{}), func(users *db.Col, user UserData) (int, string) {

		// Do some trivial checking on the email and password before processing
		if !strings.Contains(user.Email, "@") || !strings.Contains(user.Email, ".") {
			log.Println(user.Email, "has no @ or .")
			return 403, "Invalid Email Address"
		}
		if len(user.Password) < 1 {
			log.Println("Empty Password")
			return 403, "Empty Password"
		}

		foundUser := lookupUser(users, user.Email)
		if foundUser != nil {
			if foundUser["Password"] == user.Password {
				if foundUser["Valid"] == true {
					log.Println("Successful Login:", user.Email)
					return 202, "Login Accepted"
				} else {
					log.Println("Awaiting Validation:", user.Email)
					return 403, "Awaiting Account Validation (please check your email)"
				}
			} else {
				log.Println("Failed Login:", user.Email)
				return 403, "Login Failed"
			}
		}
		log.Println("No such user:", user.Email)
		return 404, "User Not Found"
	})

	// Register new account
	m.Post("/register", binding.Bind(UserData{}), func(users *db.Col, user UserData) (int, string) {
		retval, resultStr := createUser(users, user)
		if retval >= 400 {
			log.Println("Error creating user:", resultStr)
			return retval, resultStr
		} else {
			go sendRegoEmail(user)
			return 202, "New Account Registered"
		}
	})

	// Validate an account
	m.Get("/validate/:key", func(users *db.Col, params martini.Params) (int, string) {
		retval, resultStr := validateUser(users, params)
		if retval >= 400 {
			log.Println("Error Validating User:", resultStr)
			return retval, resultStr
		} else {
			return retval, "Thanks " + resultStr + ", your account has now been validated, and you can start playing !!"
		}
	})

	// Forgot Password
	m.Post("/forgot", binding.Bind(UserData{}), func(users *db.Col, user UserData) (int, string) {
		return forgotPassword(users, user)
	})

	m.RunOnAddr(":8230")
}
