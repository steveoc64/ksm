package main

import (
	"crypto/md5"
	"encoding/hex"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"log"
)

// DataTypes for communication
type (
	UserData struct {
		Id       bson.ObjectId `bson:"_id,omitempty"`
		Email    string        `form:"email" json:"Email"`
		Password string        `form:"password" json:"Password"`
		Valid    bool          `json:"Valid"`
		LoggedIn bool          `json:"LoggedIn"`
		Location string        `form:"Location" json:"location"`
		Lat      float64       `json:"Lat"`
		Lng      float64       `json:"Lng"`
		Credit   int           `json:"Credit"`
		Scale    string        `form:"scale" json:"Scale"`
		Armies   string        `form:"armies" json:"Armies"`
		GameTime string        `form:"gametime" json:"GameTime"`
	}
)

// Init MongoDB
func DB() *mgo.Database {
	session, err := mgo.Dial("mongodb://localhost") // mongodb://localhost
	if err != nil {
		log.Println(err)
	}

	return session.DB("kriegsspiel")
}

// Get the MD5 hash of a string, in HEX format
func GetMD5HexHash(text string) string {
	hash := md5.Sum([]byte(text))
	return hex.EncodeToString(hash[:])
}

func validateUser(key string) (int, string) {
	db := DB()
	users := db.C("users")

	var foundUsers []UserData

	err := users.
		Find(bson.M{"valid": false}).
		Select(bson.M{"email": true, "password": true}).
		All(&foundUsers)

	if err != nil {
		return 500, err.Error()
	}
	gotSome := false
	for index, user := range foundUsers {
		log.Println(index, user.Id, user.Email, user.Password, user.Valid)
		hash := GetMD5HexHash(user.Email + user.Password)
		if hash == key {
			log.Println("We have a match !!")
			err = users.UpdateId(user.Id,
				bson.M{"$set": bson.M{"valid": true}})
			if err != nil {
				log.Println(err)
			} else {
				gotSome = true
			}
		} else {
			log.Println("This one is no match !!")
		}
	}

	if gotSome {
		return 201, "User Validated"
	}

	return 404, "Not Found"
}

// Main function
func main() {

	key := "463bc7d627a3f32d73ee13047dbfa294"
	retval, retstr := validateUser(key)
	log.Println(retval, retstr)
}
