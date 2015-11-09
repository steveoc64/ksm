var _id = 1

var endSection = function() {
	print('=========================================================================')
}

// Connect to the database
db = connect('localhost/kriegsspiel')
endSection()

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Create some Rating definitions
var rating = [
	{name: 'Rabble', hp: 3, test: 9},
	{name: 'Militia', hp: 4, test: 9},
	{name: 'Landwehr', hp: 5, test: 8},
	{name: 'Conscript', hp: 5, test: 7},
	{name: 'Regular', hp: 6, test: 6},
	{name: 'Veteran', hp: 6, test: 5},
	{name: 'Crack', hp: 6, test: 4},
	{name: 'Elite', hp: 7, test: 4},
	{name: 'Grenadier', hp: 7, test: 3},
	{name: 'Guard', hp: 8, test: 3},
	{name: 'OldGuard', hp: 8, test: 2},
]

var findRating = function(name) {
	print('findRating',name)
	var p = db.rating.find({name: name}).next()	
	return p._id
}

print('Adding Ratings')
db.rating.remove({})
_id = 1
rating.forEach(function(data){
	data._id = _id++
	printjson(data)
	db.rating.insert(data)
})

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Define some periods and theatres
var period = [
	{code: 'N00', name: "Linear European", from: 1680, to: 1791, lat: 52.277, lng: 8.892}, // centered on minden in Germany   52.277440, 8.891735
//	{code: 'N01', name: "American Revolution", from: 1775, to: 1783, lat: 42.451, lng: -71.228}, // centered on Lexington, MA, 42.450614, -71.227835
	{code: 'N10', name: "French Revolution", from: 1791, to: 1804, lat: 49.078, lng: 4.768},	// centered on Valmy in France
	{code: 'N11', name: "Napoleon in the Orient", from: 1798, to: 1801, lat: 30.446, lng: 31.220},	// centered on Cairo 30.446061, 31.220356
	{code: 'N20', name: "French Empire", from: 1805, to: 1811, lat: 49.127, lng: 16.762},  // centered on Austerlitz 49.127814, 16.761821
	{code: 'N30', name: "Peninsula Wars", from: 1807, to: 1814, lat: 39.054, lng: -6.463 }, // centered on Badajoz 39.054890, -6.462567
	{code: 'N40', name: "Napoleon in Russia", from: 1812, to: 1812, lat: 54.666, lng: 30.748 }, // centered on Orsha-Smolensk 54.666322, 30.747863
	{code: 'N41', name: "Persian Wars", from: 1804, to: 1813, lat: 40.682, lng: 46.360 }, // centered on Azeri / Nth Iran 40.682778, 46.360556
	{code: 'N42', name: "Ottoman Adventures", from: 1801, to: 1818, lat: 41.014, lng: 28.955 }, // centered on Istambul 41.013611, 28.955
	{code: 'N50', name: "Wars of Liberation", from: 1813, to: 1815, lat: 51.123, lng: 13.466 },  // centered on Dresden  51.123833, 13.465655
	{code: 'N51', name: "100 Days Campaign", from: 1815, to: 1815, lat: 50.512, lng: 4.434 }, // centered on Waterloo - Quatre Bras 50.512215, 4.434584
	{code: 'N60', name: "India", from: 1801, to: 1825, lat: 12.918, lng: 79.113 }, // centered on Vellore, India 12.918049, 79.112849
]

var findPeriod = function(name) {
	print('findPeriod',name)
	var p = db.period.find({name: name}).next()
	return p._id
}
var findPeriodCode = function(name) {
	print('findPeriodCode',name)
	var p = db.period.find({name: name}).next()
	return p.code
}

print('Adding Period table')
db.period.remove({})
_id = 1
period.forEach(function(data){
	data._id = _id++
	printjson(data)
	db.period.insert(data)
})
endSection()

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Create Infantry organisation and doctrines table
// SK values = {organic - by splitting 1 line base into 2 SK bases, 3rd rank}
// Bases [
//		close divisions, 
//		permanent Sk base
//		French system of elite div  (treat as close div with + 1 fire, normal div + 1 Sk base, or split into 2 Sk bases),
//		3rd rank system .... each line base can emit 1 Sk, and drop to 2rank. Loss of Sk = 2 hits on parent unit, injured SK = 1 hit on parent
//
//  Each base = 75 men in 1 rank,  150 men in 2 ranks, 225 men in 3 ranks
//  Cav base = 75 horse / 1 Sqn
//  Gun base = 2 guns
//
//

var infantry = [
	{name: 'Linear', desc: '4 coy', bases: [4,0,0,0], ranks: 3, fire: ['Crack','Conscript'], bayonet: ['Elite','Conscript'], image: 'ligne'},
	{name: 'Early French', desc: '8-9 coy', bases: [4,1,0,0], ranks: 3, fire: ['Crack','Conscript'], bayonet: ['Elite','Militia'], image: 'ligne'},
	{name: 'Ligne', desc: '3 divisions', bases: [3,0,1,0], ranks: 3, fire: ['Crack','Conscript'], bayonet: ['Elite','Conscript'], image: 'ligne'},
	{name: 'Legere', desc: '3 divisions', bases: [3,1,1,1], ranks: 3, fire: ['Veteran','Conscript'], bayonet: ['Elite','Conscript'], image: 'legere'},
	{name: 'Guard', desc: '4 divisions', bases: [4,0,1,1], ranks: 3, fire: ['Elite','Militia'], bayonet: ['Veteran','Militia'], shock: 1, image: 'grenadier'},
	{name: 'Provisional', desc: '3 divisions', bases: [3,0,0,0], ranks: 3, fire: ['Guard','Conscript'], bayonet: ['Guard','Conscript'], image: 'ligne'},
	{name: 'Marine', desc: '4 coy', bases: [4,0,0,0], ranks: 3, fire: ['Guard','Regular'], bayonet: ['Crack','Conscript'], shock: 1, image: 'grenadier'},
	{name: 'Prussian', desc: '4 coy', bases: [4,0,0,1], ranks: 3, fire: ['Crack','Conscript'], bayonet: ['Grenadier','Conscript'], image: 'ligne'},
	{name: 'Landwehr', desc: '4 coy', bases: [4,0,0,0], ranks: 3, fire: ['Elite','Conscript'], bayonet: ['Guard','Conscript'], image: 'ligne'},
	{name: 'Militia', desc: '2 coy', bases: [2,1,0,0], ranks: 3, fire: ['Elite','Conscript'], bayonet: ['Guard','Regular'], image: 'ligne'},
	{name: 'Austrian', desc: '6 coy', bases: [6,0,0,1], ranks: 3, fire: ['Crack','Conscript'], bayonet: ['Grenadier','Conscript'], image: 'ligne'},
	{name: 'Russian', desc: 'Battalion/Regiment', bases: [4,0,0,0], ranks: 3, fire: ['Grenadier','Regular'], bayonet: ['Crack','Militia'], image: 'ligne'},
	{name: 'British', desc: '10 coy', bases: [5,0,1,0], ranks: 2, fire: ['Regular','Conscript'], bayonet: ['Elite','Militia'], image: 'ligne'},
	{name: 'Grenadier', desc: '4 coy', bases: [4,0,0,1], ranks: 3, fire: ['Grenadier','Conscript'], bayonet: ['Crack','Militia'], shock: 1, image: 'grenadier'},
	{name: 'Jager', desc: '3 coy', bases: [0,6,0,0], ranks: 1, fire: ['Crack','Conscript'], bayonet: ['Guard','Regular'], image: 'jager'},
	{name: 'Grenzer', desc: '4 coy', bases: [0,8,0,0], ranks: 1, fire: ['Guard','Conscript'], bayonet: ['Veteran','Conscript'], image: 'grenzer'},
	{name: 'Rifles', desc: '3 coy', bases: [0,6,0,0], ranks: 1, fire: ['Crack','Conscript'], bayonet: ['Guard','Regular'], rifle: 1, image: 'jager'},
	{name: 'Fusilier', desc: '4 coy', bases: [2,2,0,1], ranks: 3, fire: ['Veteran','Conscript'], bayonet: ['Guard','Regular'], image: 'fusilier'},
]


var findInfantry = function(name) {
	print('findInfantry',name)
	var d = db.infantry.find({name: name}).next()
	return d._id
}

print('Adding Infantry')
db.infantry.remove({})
_id = 1
infantry.forEach(function(data){
	data._id = _id++
	data.fire[0] = findRating(data.fire[0])
	data.fire[1] = findRating(data.fire[1])
	data.bayonet[0] = findRating(data.bayonet[0])
	data.bayonet[1] = findRating(data.bayonet[1])
	printjson(data)
	db.infantry.insert(data)
})
endSection()


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// define some Cmd types

var cmds = [
	{name: "Brigadier", image: 'cmdr-ligne'},
	{name: "Light Infantry General", image: 'cmdr-legere'},
	{name: 'Guard General', image: 'cmdr-guard'},
	{name: 'Divisional General', image: 'cmdr-div'},
	{name: 'Corps Commander', image: 'cmdr-corps'},
	{name: 'Cavalry General', image: 'hussar'},
	{name: 'Artillery General', image: 'cmdr-bty'},
	{name: 'ADC', image: 'courier'},
]

var findCmd = function(name) {
	print('findCmd',name)
	var p = db.cmd.find({name: name}).next()
	return p._id
}

print('Adding Commander Types')
db.cmd.remove({})
_id = 1
cmds.forEach(function(data){
	data._id = _id++
	printjson(data)
	db.cmd.insert(data)
})
endSection()

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// define some cav types

var cavs = [
	{name: 'Cuirassier',cr: 16, sk: 0, scout: 1, image: 'cuirassier'},
	{name: 'Dragoon', cr: 10, sk: 1, scout: 2, dismount: 1, image: 'dragoon'},
	{name: 'Hussar', cr: 12, sk: 1, scout: 3, image: 'hussar'},
	{name: 'Lancer', cr: 12, sk: 0, lance: 1, scout: 2, image: 'lancer'},
	{name: 'Chasseur', cr: 8, sk: 1, scout: 3, image: 'chasseur'},
	{name: 'Landwehr', cr: 6, sk: 0, cossack: 1, scout: 1, lance: 1, image: 'landwehrcav'},
	{name: 'Cossack', cr: 6, sk: 1, cossack: 1, scout: 2, image: 'cossack'},
]

var findCav = function(name) {
	print('findCav',name)
	var p = db.cav.find({name: name}).next()
	return p._id
}

print('Adding Cavalry Types')
db.cav.remove({})
_id = 1
cavs.forEach(function(data){
	data._id = _id++
	printjson(data)
	db.cav.insert(data)
})
endSection()

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// define some Gun type

var guns = [
	{name: '3lb', calibre: 3, weight: 2, image: '3lb', desc: 'Light Bn Gun', rc: 0, rs: 1, rr: 2},
	{name: '6lb', calibre: 6, weight: 3, image: '6lb', desc: 'Standard Field Gun', rc: 1, rs: 2, rr: 3},
	{name: '8lb', calibre: 8, weight: 4, image: '8lb', desc: 'Medium Field Gun', rc: 1, rs: 2, rr: 4},
	{name: '12lb', calibre: 12, weight: 5, image: '12lb', desc: 'Heavy Field Gun', rc: 2, rs: 3, rr: 5},
	{name: 'Howitzer', calibre: 7, weight: 4, hw: 1, image: 'licorne', desc: 'Indirect Fire & Incendary', rc: 1, rs: 3, rr: 4},
	{name: 'Siege Guns', calibre: 24, weight: 6, image: 'siege', desc: 'Huge and Unwieldy', rc: 2, rs: 5, rr: 6},
	{name: '3lb Horse', calibre: 3, weight: 1, horse: 1, image: '3lb', desc: 'Light Horse Gun', rc: 0, rs: 1, rr: 2},
	{name: '6lb Horse', calibre: 6, weight: 2, horse: 1, image: '6lb', desc: 'Std Horse Artillery', rc: 1, rs: 2, rr: 2},
]

var findGun = function(name) {
	print('findGun',name)
	var p = db.gun.find({name: name}).next()
	return p._id
}

print('Adding Gun Types')
db.gun.remove({})
_id = 1
guns.forEach(function(data){
	data._id = _id++
	printjson(data)
	db.gun.insert(data)
})
endSection()


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// For each period/nation combo, define a set of forces as a template for Div / Bde / Cav / Art

var forces = [
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Linear European ... all nations equal at this point, until I get some 7YW stuff sorted

	{period: 'Linear European', nation: 'France', flag: 'france-roi',
		inf: ['Linear','Fusilier','Jager','Grenadier'],
		div: [
			{type: 'X', name: '1st Bde'},
			{type: 'I', name: '1st Bn, xx Regt', rating: 'Crack', attr: 'Linear', size: 900},
			{type: 'I', name: '2nd Bn, xx Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'I', name: '1st Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'I', name: '2nd Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'A', name: 'Bde Battery', rating: 'Regular', attr: '8lb', size: 8},
			{type: 'X', name: '2nd Bde'},
			{type: 'I', name: '1st Bn, aa Regt', rating: 'Veteran', attr: 'Linear', size: 900},
			{type: 'I', name: '2nd Bn, aa Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'I', name: '1st Bn, bb Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'I', name: '2nd Bn, bb Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'A', name: 'Bde Battery', rating: 'Regular', attr: '8lb', size: 8},
			{type: 'X', name: 'Cav Bde', attr: 'Cavalry General'},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Hussar', size: 300},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 600},
		],
		bde: [
			{type: 'X', attr: 'Divisional General'},
			{type: 'I', name: '1st Bn, xx Regt', rating: 'Crack', attr: 'Linear', size: 900},
			{type: 'I', name: '2nd Bn, xx Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'I', name: '1st Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'I', name: '2nd Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Hussar', size: 300},
			{type: 'A', name: 'Bde Battery', rating: 'Regular', attr: '8lb', size: 8},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Elite', attr: 'Hussar', size: 300},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Lancer', size: 300},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 300},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 300},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Grenadier', attr: 'Cuirassier', size: 600},
			{type: 'A', name: 'Horse Battery', rating: 'Elite', attr: '6lb Horse', size: 6},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: '1st Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: '2nd Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 6},
		],
	},
	{period: 'Linear European', nation: 'Prussia', flag: 'prussia0',
		inf: ['Linear','Fusilier','Jager','Grenadier'],
		div: [
			{type: 'X', name: '1st Bde'},
			{type: 'I', name: '1st Bn, xx Regt', rating: 'Crack', attr: 'Linear', size: 900},
			{type: 'I', name: '2nd Bn, xx Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'I', name: '1st Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'I', name: '2nd Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'A', name: 'Bde Battery', rating: 'Regular', attr: '6lb', size: 8},
			{type: 'X', name: '2nd Bde'},
			{type: 'I', name: '1st Bn, aa Regt', rating: 'Veteran', attr: 'Linear', size: 900},
			{type: 'I', name: '2nd Bn, aa Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'I', name: '1st Bn, bb Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'I', name: '2nd Bn, bb Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'A', name: 'Bde Battery', rating: 'Regular', attr: '6lb', size: 8},
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Hussar', size: 400},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 600},
		],
		bde: [
			{type: 'X', attr: 'Brigadier'},
			{type: 'I', name: '1st Bn, xx Regt', rating: 'Crack', attr: 'Linear', size: 900},
			{type: 'I', name: '2nd Bn, xx Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'I', name: '1st Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'I', name: '2nd Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Hussar', size: 200},
			{type: 'A', name: 'Bde Battery', rating: 'Regular', attr: '6lb', size: 8},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Elite', attr: 'Hussar', size: 375},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Lancer', size: 350},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 400},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 400},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Grenadier', attr: 'Cuirassier', size: 600},
			{type: 'A', name: 'Horse Battery', rating: 'Elite', attr: '6lb', size: 6, horse: 1},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: '1st Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: '2nd Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 6},
		],
	},
	{period: 'Linear European', nation: 'Austria', flag: 'austria',
		inf: ['Linear','Fusilier','Jager','Grenadier'],
		div: [
			{type: 'X', name: '1st Bde'},
			{type: 'I', name: '1st Bn, xx Regt', rating: 'Crack', attr: 'Linear', size: 900},
			{type: 'I', name: '2nd Bn, xx Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'I', name: '1st Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'I', name: '2nd Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'A', name: 'Bde Battery', rating: 'Regular', attr: '6lb', size: 8},
			{type: 'X', name: '2nd Bde'},
			{type: 'I', name: '1st Bn, aa Regt', rating: 'Veteran', attr: 'Linear', size: 900},
			{type: 'I', name: '2nd Bn, aa Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'I', name: '1st Bn, bb Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'I', name: '2nd Bn, bb Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'A', name: 'Bde Battery', rating: 'Regular', attr: '6lb', size: 8},
			{type: 'X', name: 'Cav Bde', attr: 'Cavalry General'},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Hussar', size: 400},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 600},
		],
		bde: [
			{type: 'X', name: 'Brigade Cmdr', attr: 'Brigadier'},
			{type: 'I', name: '1st Bn, xx Regt', rating: 'Crack', attr: 'Linear', size: 900},
			{type: 'I', name: '2nd Bn, xx Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'I', name: '1st Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'I', name: '2nd Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Hussar', size: 200},
			{type: 'A', name: 'Bde Battery', rating: 'Regular', attr: '6lb', size: 8},
		],
		cav: [
			{type: 'X', name: 'Cav Bde', attr: 'Cavalry General'},
			{type: 'C', name: 'Light Cavalry', rating: 'Elite', attr: 'Hussar', size: 375},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Lancer', size: 350},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 400},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 400},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Grenadier', attr: 'Cuirassier', size: 600},
			{type: 'A', name: 'Horse Battery', rating: 'Elite', attr: '6lb', size: 6, horse: 1},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: '1st Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: '2nd Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 6},
		],
	},
	{period: 'Linear European', nation: 'Britain', flag: 'britain',
		inf: ['Linear','Fusilier','Jager','Grenadier'],
		div: [
			{type: 'X', name: '1st Bde'},
			{type: 'I', name: '1st Bn, xx Regt', rating: 'Crack', attr: 'Linear', size: 900},
			{type: 'I', name: '2nd Bn, xx Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'I', name: '1st Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'I', name: '2nd Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'A', name: 'Bde Battery', rating: 'Regular', attr: '6lb', size: 8},
			{type: 'X', name: '2nd Bde'},
			{type: 'I', name: '1st Bn, aa Regt', rating: 'Veteran', attr: 'Linear', size: 900},
			{type: 'I', name: '2nd Bn, aa Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'I', name: '1st Bn, bb Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'I', name: '2nd Bn, bb Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'A', name: 'Bde Battery', rating: 'Regular', attr: '6lb', size: 8},
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Hussar', size: 400},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 600},
		],
		bde: [
			{type: 'X'},
			{type: 'I', name: '1st Bn, xx Regt', rating: 'Crack', attr: 'Linear', size: 900},
			{type: 'I', name: '2nd Bn, xx Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'I', name: '1st Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'I', name: '2nd Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 900},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Hussar', size: 200},
			{type: 'A', name: 'Bde Battery', rating: 'Regular', attr: '6lb', size: 8},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Elite', attr: 'Hussar', size: 375},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Lancer', size: 350},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 400},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 400},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Grenadier', attr: 'Cuirassier', size: 600},
			{type: 'A', name: 'Horse Battery', rating: 'Elite', attr: '6lb', size: 6, horse: 1},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: '1st Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: '2nd Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 6},
		],
	},
	{period: 'Linear European', nation: 'Bavaria', flag: 'bavaria',
		inf: ['Linear','Fusilier','Jager','Grenadier'],
		div: [
			{type: 'X', name: '1st Bde'},
			{type: 'I', name: '1st Bn, xx Regt', rating: 'Crack', attr: 'Linear', size: 700},
			{type: 'I', name: '2nd Bn, xx Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'I', name: '1st Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'I', name: '2nd Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'A', name: 'Bde Battery', rating: 'Regular', attr: '6lb', size: 8},
			{type: 'X', name: '2nd Bde'},
			{type: 'I', name: '1st Bn, aa Regt', rating: 'Veteran', attr: 'Linear', size: 700},
			{type: 'I', name: '2nd Bn, aa Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'I', name: '1st Bn, bb Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'I', name: '2nd Bn, bb Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'A', name: 'Bde Battery', rating: 'Regular', attr: '6lb', size: 8},
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Hussar', size: 400},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 600},
		],
		bde: [
			{type: 'X'},
			{type: 'I', name: '1st Bn, xx Regt', rating: 'Crack', attr: 'Linear', size: 700},
			{type: 'I', name: '2nd Bn, xx Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'I', name: '1st Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'I', name: '2nd Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Hussar', size: 200},
			{type: 'A', name: 'Bde Battery', rating: 'Regular', attr: '6lb', size: 8},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Elite', attr: 'Hussar', size: 375},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Lancer', size: 350},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 400},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 400},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Grenadier', attr: 'Cuirassier', size: 600},
			{type: 'A', name: 'Horse Battery', rating: 'Elite', attr: '6lb', size: 6, horse: 1},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: '1st Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: '2nd Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 6},
		],
	},
	{period: 'Linear European', nation: 'Russia', flag: 'russia-empire',
		inf: ['Linear','Fusilier','Jager','Grenadier'],
		div: [
			{type: 'X', name: '1st Bde'},
			{type: 'I', name: '1st Bn, xx Regt', rating: 'Crack', attr: 'Linear', size: 700},
			{type: 'I', name: '2nd Bn, xx Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'I', name: '1st Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'I', name: '2nd Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'A', name: 'Bde Battery', rating: 'Regular', attr: '6lb', size: 8},
			{type: 'X', name: '2nd Bde'},
			{type: 'I', name: '1st Bn, aa Regt', rating: 'Veteran', attr: 'Linear', size: 700},
			{type: 'I', name: '2nd Bn, aa Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'I', name: '1st Bn, bb Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'I', name: '2nd Bn, bb Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'A', name: 'Bde Battery', rating: 'Regular', attr: '6lb', size: 8},
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Hussar', size: 400},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 600},
		],
		bde: [
			{type: 'X'},
			{type: 'I', name: '1st Bn, xx Regt', rating: 'Crack', attr: 'Linear', size: 700},
			{type: 'I', name: '2nd Bn, xx Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'I', name: '1st Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'I', name: '2nd Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Hussar', size: 200},
			{type: 'A', name: 'Bde Battery', rating: 'Regular', attr: '6lb', size: 8},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Elite', attr: 'Hussar', size: 375},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Lancer', size: 350},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 400},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 400},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Grenadier', attr: 'Cuirassier', size: 600},
			{type: 'A', name: 'Horse Battery', rating: 'Elite', attr: '6lb', size: 6, horse: 1},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: '1st Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: '2nd Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 6},
		],
	},


	//////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// French Revolution
	//		French, Austrian, Prussian, Russian, Bavarian, Rebels

	{period: 'French Revolution', nation: 'French Republique', flag: 'france1794',
		inf: ['Linear','Early French','Fusilier','Grenadier','Jager'],
		div: [
			{type: 'X', name: '1st Demi Bde'},
			{type: 'I', name: '1e Bn', rating: 'Veteran', attr: 'Early French', size: 700},
			{type: 'I', name: '2e Bn', rating: 'Regular', attr: 'Early French', size: 700},
			{type: 'I', name: '3e Bn', rating: 'Conscript', attr: 'Early French', size: 700},
			{type: 'X', name: '2nd Demi Bde'},
			{type: 'I', name: '1e Bn', rating: 'Veteran', attr: 'Early French', size: 700},
			{type: 'I', name: '2e Bn', rating: 'Regular', attr: 'Early French', size: 700},
			{type: 'I', name: '3e Bn', rating: 'Conscript', attr: 'Early French', size: 700},
			{type: 'X', name: 'Artillery Cmd'},
			{type: 'A', name: 'Battery', rating: 'Veteran', attr: '6lb', size: 8},
		],
		bde: [
			{type: 'X', name: 'Bde'},
			{type: 'I', name: '1e Bn', rating: 'Elite', attr: 'Early French', size: 700},
			{type: 'I', name: '2e Bn', rating: 'Veteran', attr: 'Early French', size: 700},
			{type: 'I', name: '3e Bn', rating: 'Veteran', attr: 'Early French', size: 700},
			{type: 'X', name: 'Artillery Cmd'},
			{type: 'A', name: 'Battery', rating: 'Veteran', attr: '6lb', size: 4},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Elite', attr: 'Hussar', size: 400},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Chasseur', size: 400},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 600},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Grenadier', attr: 'Cuirassier', size: 600},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: '1st Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: '2nd Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 6},
		],
	},
	{period: 'French Revolution', nation: 'French Royalist', flag: 'france-roi',
		inf: ['Linear','Fusilier','Grenadier','Jager'],
		div: [
			{type: 'X', name: '1st Bde'},
			{type: 'I', name: '1st Bn, xx Regt', rating: 'Crack', attr: 'Linear', size: 700},
			{type: 'I', name: '2nd Bn, xx Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'I', name: '1st Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'I', name: '2nd Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'A', name: 'Bde Battery', rating: 'Regular', attr: '6lb', size: 8},
			{type: 'X', name: '2nd Bde'},
			{type: 'I', name: '1st Bn, aa Regt', rating: 'Veteran', attr: 'Linear', size: 700},
			{type: 'I', name: '2nd Bn, aa Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'I', name: '1st Bn, bb Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'I', name: '2nd Bn, bb Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'A', name: 'Bde Battery', rating: 'Regular', attr: '6lb', size: 8},
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Hussar', size: 400},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 600},
		],
		bde: [
			{type: 'X'},
			{type: 'I', name: '1st Bn, xx Regt', rating: 'Crack', attr: 'Linear', size: 700},
			{type: 'I', name: '2nd Bn, xx Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'I', name: '1st Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'I', name: '2nd Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Hussar', size: 200},
			{type: 'A', name: 'Bde Battery', rating: 'Regular', attr: '6lb', size: 8},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Elite', attr: 'Hussar', size: 375},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Lancer', size: 350},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 400},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 400},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Grenadier', attr: 'Cuirassier', size: 600},
			{type: 'A', name: 'Horse Battery', rating: 'Elite', attr: '6lb', size: 6, horse: 1},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: '1st Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: '2nd Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 6},
		],
	},
	{period: 'French Revolution', nation: 'Austria', flag: 'austria',
		inf: ['Linear','Fusilier','Grenadier','Jager','Grenzer'],
		div: [
			{type: 'X', name: '1st Bde'},
			{type: 'I', name: '1st Bn xx Regt', rating: 'Crack', attr: 'Linear', size: 1075},
			{type: 'I', name: '2nd Bn xx Regt', rating: 'Crack', attr: 'Linear', size: 1075},
			{type: 'I', name: 'Jager Bn', rating: 'Elite', attr: 'Rifles', size: 200},
			{type: 'I', name: 'Light Bn', rating: 'Regular', attr: 'Fusilier', size: 400},
			{type: 'X', name: '2nd Bde'},
			{type: 'I', name: '1st Bn yy Regt', rating: 'Regular', attr: 'Linear', size: 1075},
			{type: 'I', name: '2nd Bn yy Regt', rating: 'Regular', attr: 'Linear', size: 1075},
			{type: 'I', name: '3rd Bn yy Regt', rating: 'Regular', attr: 'Linear', size: 1075},
			{type: 'X', name: '3rd Bde'},
			{type: 'I', name: '1st Bn zz Regt', rating: 'Regular', attr: 'Linear', size: 1075},
			{type: 'I', name: '2nd Bn zz Regt', rating: 'Regular', attr: 'Linear', size: 1075},
			{type: 'I', name: '3rd Bn zz Regt', rating: 'Regular', attr: 'Linear', size: 1075},
			{type: 'X', name: 'Artillery'},
			{type: 'A', name: 'Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
		],
		bde: [
			{type: 'X', name: 'Elite Bde'},
			{type: 'I', name: 'xx Grenzer', rating: 'Veteran', attr: 'Grenzer', size: 600},
			{type: 'I', name: 'xx Grenzer', rating: 'Regular', attr: 'Grenzer', size: 400},
			{type: 'I', name: 'xx Jager Bn', rating: 'Veteran', attr: 'Rifles', size: 300},
			{type: 'I', name: 'xx Jager Bn', rating: 'Regular', attr: 'Jager', size: 200},
			{type: 'I', name: 'xx Gren Bn', rating: 'Grenadier', attr: 'Grenadier', size: 600},
			{type: 'I', name: 'xx Gren Bn', rating: 'Grenadier', attr: 'Grenadier', size: 600},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Elite', attr: 'Hussar', size: 400},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Chasseur', size: 400},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 600},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Grenadier', attr: 'Cuirassier', size: 600},
			{type: 'A', name: 'Horse Artillery Bty', rating: 'Elite', attr: '6lb', size: 6},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: '1st Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: '2nd Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 6},
		],
	},
	{period: 'French Revolution', nation: 'Prussia', flag: 'prussia0',
		inf: ['Linear','Fusilier','Grenadier','Jager'],
		div: [
			{type: 'X', name: '1st Bde'},
			{type: 'I', name: '1st Bn, xx Regt', rating: 'Crack', attr: 'Linear', size: 700},
			{type: 'I', name: '2nd Bn, xx Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'I', name: '3rd Bn, xx Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'I', name: '1st Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'I', name: '2nd Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'A', name: 'Field Battery', rating: 'Regular', attr: '6lb', size: 8},
			{type: 'X', name: '2nd Bde'},
			{type: 'I', name: '1st Bn, aa Regt', rating: 'Veteran', attr: 'Linear', size: 700},
			{type: 'I', name: '2nd Bn, aa Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'I', name: '1st Bn, bb Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'I', name: '2nd Bn, bb Regt', rating: 'Regular', attr: 'Linear', size: 700},
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Hussar', size: 500},
			{type: 'A', name: 'Horse Artillery', rating: 'Regular', attr: '6lb', size: 6, horse: 1},
		],
		bde: [
			{type: 'X', name: 'Light Bde'},
			{type: 'I', name: 'Jager', rating: 'Elite', attr: 'Jager', size: 200},
			{type: 'I', name: 'xx Fusliers', rating: 'Crack', attr: 'Fusilier', size: 400},
			{type: 'I', name: 'yy Fusiliers', rating: 'Regular', attr: 'Linear', size: 400},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Hussar', size: 500},
			{type: 'A', name: 'Horse Artillery', rating: 'Veteran', attr: '6lb', size: 6, horse: 1},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Elite', attr: 'Hussar', size: 500},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Lancer', size: 500},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 500},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 500},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Grenadier', attr: 'Cuirassier', size: 500},
			{type: 'A', name: 'Horse Battery', rating: 'Elite', attr: '6lb', size: 6, horse: 1},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: '1st Field Battery', rating: 'Regular', attr: '6lb', size: 8},
			{type: 'A', name: '2nd Field Battery', rating: 'Regular', attr: '6lb', size: 8},
			{type: 'A', name: 'Heavy Battery', rating: 'Veteran', attr: '12lb', size: 6},
		],
	},

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// French Empire
	//		French, Austrian, Prussian, Russian, British, Bavarian, Rhineland


	{period: 'French Empire', nation: 'France', flag: 'france1804',
		inf: ['Ligne','Legere','Guard'],
		div: [
			{type: 'X', name: 'Light Bde'},
			{type: 'I', name: '1e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
			{type: 'I', name: '2e Bn, xx Legere', rating: 'Veteran', attr: 'Legere', size: 700},
			{type: 'I', name: '3e Bn, xx Legere', rating: 'Veteran', attr: 'Legere', size: 700},
			{type: 'X', name: '1st Line Bde'},
			{type: 'I', name: '1e Bn, xx Ligne', rating: 'Veteran', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, xx Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '1e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'X', name: '2nd Line Bde'},
			{type: 'I', name: '1e Bn, xx Ligne', rating: 'Veteran', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, xx Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '1e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'X', name: 'Artillery Bty'},
			{type: 'A', name: 'Field Battery', rating: 'Elite', attr: '6lb', size: 8},
		],
		bde: [
			{type: 'X', name: 'Light Bde'},
			{type: 'I', name: '1e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
			{type: 'I', name: '2e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
			{type: 'I', name: '3e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Elite', attr: 'Chasseur', size: 300},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Chasseur', size: 300},
			{type: 'C', name: 'Dragoons', rating: 'Crack', attr: 'Dragoon', size: 300},
			{type: 'A', name: 'Battery', rating: 'Veteran', attr: '6lb', size: 6, horse: 1},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: 'Field Battery', rating: 'Elite', attr: '6lb', size: 8},
			{type: 'A', name: 'Horse Battery', rating: 'Elite', attr: '6lb', size: 6, horse: 1},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 8},
		],
	},
	{period: 'French Empire', nation: 'Prussia', flag: 'prussia0',
		inf: ['Linear','Fusilier','Jager','Grenadier'],
		div: [
			{type: 'X', name: '1st Bde'},
			{type: 'I', name: 'xx/yy Grenadiers', rating: 'Grenadier', attr: 'Linear', size: 800},
			{type: 'I', name: '1st Bn, xx Regt', rating: 'Crack', attr: 'Linear', size: 800},
			{type: 'I', name: '2nd Bn, xx Regt', rating: 'Regular', attr: 'Linear', size: 800},
			{type: 'I', name: '1st Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 800},
			{type: 'I', name: '2nd Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 800},
			{type: 'A', name: 'Foot Battery', rating: 'Veteran', attr: '6lb', size: 6},
			{type: 'X', name: '2nd Bde'},
			{type: 'I', name: 'xx/yy Grenadiers', rating: 'Grenadier', attr: 'Linear', size: 800},
			{type: 'I', name: '1st Bn, xx Regt', rating: 'Crack', attr: 'Linear', size: 800},
			{type: 'I', name: '2nd Bn, xx Regt', rating: 'Regular', attr: 'Linear', size: 800},
			{type: 'I', name: '1st Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 800},
			{type: 'I', name: '2nd Bn, yy Regt', rating: 'Regular', attr: 'Linear', size: 800},
			{type: 'A', name: 'Foot Battery', rating: 'Veteran', attr: '6lb', size: 6},
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Dragoons', rating: 'Crack', attr: 'Dragoon', size: 500},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Grenadier', attr: 'Cuirassier', size: 500},
			{type: 'A', name: 'Horse Battery', rating: 'Veteran', attr: '6lb', size: 6, horse: 1},
		],
		bde: [
			{type: 'X', name: 'Light Bde'},
			{type: 'I', name: 'xx Fusilier Bn', rating: 'Crack', attr: 'Fusilier', size: 600},
			{type: 'I', name: 'yy Fusiler', rating: 'Veteran', attr: 'Fusilier', size: 600},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Chasseur', size: 600},
			{type: 'A', name: 'Battery', rating: 'Veteran', attr: '6lb', size: 6, horse: 1},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Elite', attr: 'Hussar', size: 400},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Chasseur', size: 400},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 600},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Grenadier', attr: 'Cuirassier', size: 600},
			{type: 'A', name: 'Battery', rating: 'Veteran', attr: '6lb', size: 6, horse: 1},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: '1st Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: '2nd Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 6},
		],
	},
	{period: 'French Empire', nation: 'Austria', flag: 'austria',
		inf: ['Austrian','Landwehr','Grenadier','Jager','Grenzer'],
		div: [
			{type: 'X', name: '1st Bde'},
			{type: 'I', name: '1st Bn xx Regt', rating: 'Crack', attr: 'Austrian', size: 1075},
			{type: 'I', name: '2nd Bn xx Regt', rating: 'Crack', attr: 'Austrian', size: 1075},
			{type: 'I', name: 'Jager Bn', rating: 'Elite', attr: 'Rifles', size: 200},
			{type: 'I', name: 'Light Bn', rating: 'Regular', attr: 'Fusilier', size: 400},
			{type: 'X', name: '2nd Bde'},
			{type: 'I', name: '1st Bn yy Regt', rating: 'Regular', attr: 'Austrian', size: 1075},
			{type: 'I', name: '2nd Bn yy Regt', rating: 'Regular', attr: 'Austrian', size: 1075},
			{type: 'I', name: '3rd Bn yy Regt', rating: 'Regular', attr: 'Austrian', size: 1075},
			{type: 'X', name: '3rd Bde'},
			{type: 'I', name: '1st Bn zz Regt', rating: 'Regular', attr: 'Austrian', size: 1075},
			{type: 'I', name: '2nd Bn zz Regt', rating: 'Regular', attr: 'Austrian', size: 1075},
			{type: 'I', name: '3rd Bn zz Regt', rating: 'Regular', attr: 'Austrian', size: 1075},
			{type: 'X', name: 'Artillery'},
			{type: 'A', name: 'Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
		],
		bde: [
			{type: 'X', name: 'Elite Bde'},
			{type: 'I', name: 'xx Grenzer', rating: 'Veteran', attr: 'Grenzer', size: 600},
			{type: 'I', name: 'xx Grenzer', rating: 'Regular', attr: 'Grenzer', size: 400},
			{type: 'I', name: 'xx Jager Bn', rating: 'Veteran', attr: 'Rifles', size: 300},
			{type: 'I', name: 'xx Jager Bn', rating: 'Regular', attr: 'Jager', size: 200},
			{type: 'I', name: 'xx Gren Bn', rating: 'Grenadier', attr: 'Grenadier', size: 600},
			{type: 'I', name: 'xx Gren Bn', rating: 'Grenadier', attr: 'Grenadier', size: 600},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Elite', attr: 'Hussar', size: 400},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Chasseur', size: 400},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 600},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Grenadier', attr: 'Cuirassier', size: 600},
			{type: 'A', name: 'Horse Artillery Bty', rating: 'Elite', attr: '6lb', size: 6},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: '1st Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: '2nd Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 6},
		],
	},

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Napoleon in the Orient
	//		French, British, Ottoman, Tribes

	{period: 'Napoleon in the Orient', nation: 'France', flag: 'france1794',
		inf: ['Linear','Fusilier','Jager','Grenadier'],
		div: [
			{type: 'X', name: '1st Demi Bde'},
			{type: 'I', name: '1e Bn', rating: 'Veteran', attr: 'Early French', size: 700},
			{type: 'I', name: '2e Bn', rating: 'Regular', attr: 'Early French', size: 700},
			{type: 'I', name: '3e Bn', rating: 'Conscript', attr: 'Early French', size: 700},
			{type: 'X', name: '2nd Demi Bde'},
			{type: 'I', name: '1e Bn', rating: 'Veteran', attr: 'Early French', size: 700},
			{type: 'I', name: '2e Bn', rating: 'Regular', attr: 'Early French', size: 700},
			{type: 'I', name: '3e Bn', rating: 'Conscript', attr: 'Early French', size: 700},
			{type: 'X', name: 'Artillery Cmd'},
			{type: 'A', name: 'Battery', rating: 'Veteran', attr: '6lb', size: 8},
		],
		bde: [
			{type: 'X', name: 'Bde'},
			{type: 'I', name: '1e Bn', rating: 'Elite', attr: 'Early French', size: 700},
			{type: 'I', name: '2e Bn', rating: 'Veteran', attr: 'Early French', size: 700},
			{type: 'I', name: '3e Bn', rating: 'Veteran', attr: 'Early French', size: 700},
			{type: 'X', name: 'Artillery Cmd'},
			{type: 'A', name: 'Battery', rating: 'Veteran', attr: '6lb', size: 4},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Elite', attr: 'Hussar', size: 400},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Chasseur', size: 400},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 600},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Grenadier', attr: 'Cuirassier', size: 600},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: '1st Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: '2nd Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 6},
		],
	},

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Peninsula Wars
	//		French, British, Spanish, Portuguese, Militia

	{period: 'Peninsula Wars', nation: 'France', flag: 'france1804',
		inf: ['Ligne','Legere','Fusilier','Jager'],
		div: [
			{type: 'X', name: 'Light Bde'},
			{type: 'I', name: '1e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
			{type: 'I', name: '2e Bn, xx Legere', rating: 'Veteran', attr: 'Legere', size: 700},
			{type: 'I', name: '3e Bn, xx Legere', rating: 'Veteran', attr: 'Legere', size: 700},
			{type: 'X', name: '1st Line Bde'},
			{type: 'I', name: '1e Bn, xx Ligne', rating: 'Veteran', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, xx Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '1e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'X', name: '2nd Line Bde'},
			{type: 'I', name: '1e Bn, xx Ligne', rating: 'Veteran', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, xx Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '1e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'X', name: 'Artillery Bty'},
			{type: 'A', name: 'Field Battery', rating: 'Elite', attr: '6lb', size: 8},
		],
		bde: [
			{type: 'X', name: 'Light Bde'},
			{type: 'I', name: '1e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
			{type: 'I', name: '2e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
			{type: 'I', name: '3e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Elite', attr: 'Chasseur', size: 300},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Chasseur', size: 300},
			{type: 'C', name: 'Dragoons', rating: 'Crack', attr: 'Dragoon', size: 300},
			{type: 'A', name: 'Battery', rating: 'Veteran', attr: '6lb', size: 6, horse: 1},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: 'Field Battery', rating: 'Elite', attr: '6lb', size: 8},
			{type: 'A', name: 'Horse Battery', rating: 'Elite', attr: '6lb', size: 6, horse: 1},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 8},
		],
	},

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Napoleon in Russia
	//		French, French Allied, Austria, Russia, Prussia, Poland

	{period: 'Napoleon in Russia', nation: 'France', flag: 'france1812',
		inf: ['Ligne','Legere','Guard'],
		div: [
			{type: 'X', name: 'Light Bde'},
			{type: 'I', name: '1e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
			{type: 'I', name: '2e Bn, xx Legere', rating: 'Veteran', attr: 'Legere', size: 700},
			{type: 'I', name: '3e Bn, xx Legere', rating: 'Veteran', attr: 'Legere', size: 700},
			{type: 'X', name: '1st Line Bde'},
			{type: 'I', name: '1e Bn, xx Ligne', rating: 'Veteran', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, xx Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '1e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'X', name: '2nd Line Bde'},
			{type: 'I', name: '1e Bn, xx Ligne', rating: 'Veteran', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, xx Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '1e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'X', name: 'Artillery Bty'},
			{type: 'A', name: 'Field Battery', rating: 'Elite', attr: '6lb', size: 8},
		],
		bde: [
			{type: 'X', name: 'Light Bde'},
			{type: 'I', name: '1e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
			{type: 'I', name: '2e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
			{type: 'I', name: '3e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Elite', attr: 'Chasseur', size: 300},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Chasseur', size: 300},
			{type: 'C', name: 'Dragoons', rating: 'Crack', attr: 'Dragoon', size: 300},
			{type: 'A', name: 'Battery', rating: 'Veteran', attr: '6lb', size: 6, horse: 1},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: 'Field Battery', rating: 'Elite', attr: '6lb', size: 8},
			{type: 'A', name: 'Horse Battery', rating: 'Elite', attr: '6lb', size: 6, horse: 1},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 8},
		],
	},
	{period: 'Napoleon in Russia', nation: 'Russia', flag: 'russia1813',
		inf: ['Russian','Jager','Militia','Grenadier'],
		div: [
			{type: 'X', name: 'Skirmish Line'},
			{type: 'I', name: 'xx Jager', rating: 'Veteran', attr: 'Jager', size: 300},
			{type: 'I', name: 'xx Jager', rating: 'Veteran', attr: 'Jager', size: 300},
			{type: 'I', name: 'xx Jager', rating: 'Veteran', attr: 'Jager', size: 300},
			{type: 'X', name: '1st Line'},
			{type: 'I', name: '1/xx Infantry Regt', rating: 'Crack', attr: 'Russian', size: 400},
			{type: 'I', name: '2/xx Infantry Regt', rating: 'Veteran', attr: 'Russian', size: 400},
			{type: 'I', name: '1/yy Infantry Regt', rating: 'Regular', attr: 'Russian', size: 400},
			{type: 'I', name: '2/yy Infantry Regt', rating: 'Regular', attr: 'Russian', size: 400},
			{type: 'X', name: '2nd Line'},
			{type: 'I', name: '1/xx Infantry Regt', rating: 'Veteran', attr: 'Russian', size: 400},
			{type: 'I', name: '2/xx Infantry Regt', rating: 'Regular', attr: 'Russian', size: 400},
			{type: 'I', name: '1/yy Infantry Regt', rating: 'Conscript', attr: 'Russian', size: 400},
			{type: 'I', name: '2/yy Infantry Regt', rating: 'Conscript', attr: 'Russian', size: 400},
		],
		bde: [
			{type: 'X', name: 'Elite Bde'},
			{type: 'I', name: '1 Bn, xx Regt', rating: 'Grenadier', attr: 'Grenadier', size: 900},
			{type: 'I', name: '2 Bn, xx Regt', rating: 'Grenadier', attr: 'Grenadier', size: 900},
			{type: 'I', name: '3 Bn, xx Regt', rating: 'Grenadier', attr: 'Grenadier', size: 900},
			{type: 'A', name: 'Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'C', name: 'Dragoons', rating: 'Elite', attr: 'Dragoon', size: 450},
			{type: 'C', name: 'Landwehr Cav', rating: 'Landwehr', attr: 'Lancer', size: 450},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Hussars', rating: 'Elite', attr: 'Hussar', size: 450},
			{type: 'C', name: 'Landwehr Cav', rating: 'Landwehr', attr: 'Lancer', size: 450},
			{type: 'C', name: 'Dragoons', rating: 'Crack', attr: 'Dragoon', size: 450},
			{type: 'C', name: 'Cuirassier', rating: 'Guard', attr: 'Cuirassier', size: 450},
			{type: 'A', name: 'Battery', rating: 'Veteran', attr: '6lb', size: 8, horse: 1},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: 'Field Battery', rating: 'Elite', attr: '6lb', size: 12},
			{type: 'A', name: 'Horse Battery', rating: 'Elite', attr: '6lb Horse', size: 8},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 12},
		],
	},

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Persian Wars
	//		Russian, Persian, Caucasus, British, Tribes

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Ottoman Adventures
	//		French, Ottoman, British, Russian, Persian, Austrian, Tribes

	{period: 'Ottoman Adventures', nation: 'France', flag: 'france1804',
		inf: ['Linear','Fusilier','Jager','Grenadier'],
		div: [
			{type: 'X', name: 'Light Bde'},
			{type: 'I', name: '1e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
			{type: 'I', name: '2e Bn, xx Legere', rating: 'Veteran', attr: 'Legere', size: 700},
			{type: 'I', name: '3e Bn, xx Legere', rating: 'Veteran', attr: 'Legere', size: 700},
			{type: 'X', name: '1st Line Bde'},
			{type: 'I', name: '1e Bn, xx Ligne', rating: 'Veteran', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, xx Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '1e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'X', name: '2nd Line Bde'},
			{type: 'I', name: '1e Bn, xx Ligne', rating: 'Veteran', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, xx Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '1e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'X', name: 'Artillery Bty'},
			{type: 'A', name: 'Field Battery', rating: 'Elite', attr: '6lb', size: 8},
		],
		bde: [
			{type: 'X', name: 'Light Bde'},
			{type: 'I', name: '1e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
			{type: 'I', name: '2e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
			{type: 'I', name: '3e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Elite', attr: 'Chasseur', size: 300},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Chasseur', size: 300},
			{type: 'C', name: 'Dragoons', rating: 'Crack', attr: 'Dragoon', size: 300},
			{type: 'A', name: 'Battery', rating: 'Veteran', attr: '6lb Horse', size: 6},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: 'Field Battery', rating: 'Elite', attr: '6lb', size: 8},
			{type: 'A', name: 'Horse Battery', rating: 'Elite', attr: '6lb Horse', size: 6},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 8},
		],
	},

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Wars of Liberation
	//		French, Saxon, Sweden, Poland, Austria, Prussia, Russia, Militia

	{period: 'Wars of Liberation', nation: 'France', flag: 'france1812',
		inf: ['Ligne','Legere','Guard','Provisional','Marine'],
		div: [
			{type: 'X', name: 'Light Bde'},
			{type: 'I', name: '1e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
			{type: 'I', name: '2e Bn, xx Legere', rating: 'Veteran', attr: 'Legere', size: 700},
			{type: 'I', name: '3e Bn, xx Legere', rating: 'Veteran', attr: 'Legere', size: 700},
			{type: 'X', name: '1st Line Bde'},
			{type: 'I', name: '1e Bn, xx Ligne', rating: 'Veteran', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, xx Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '1e Bn, yy Ligne', rating: 'Conscript', attr: 'Provisional', size: 700},
			{type: 'I', name: '2e Bn, yy Ligne', rating: 'Conscript', attr: 'Provisional', size: 700},
			{type: 'X', name: '2nd Line Bde'},
			{type: 'I', name: '1e Bn, xx Ligne', rating: 'Veteran', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, xx Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '1e Bn, yy Ligne', rating: 'Conscript', attr: 'Provisional', size: 700},
			{type: 'I', name: '2e Bn, yy Ligne', rating: 'Conscript', attr: 'Provisional', size: 700},
			{type: 'X', name: 'Artillery Bty'},
			{type: 'A', name: 'Field Battery', rating: 'Elite', attr: '6lb', size: 8},
		],
		bde: [
			{type: 'X', name: 'Light Bde'},
			{type: 'I', name: '1e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
			{type: 'I', name: '2e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
			{type: 'I', name: '3e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Elite', attr: 'Chasseur', size: 300},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Chasseur', size: 300},
			{type: 'C', name: 'Dragoons', rating: 'Crack', attr: 'Dragoon', size: 300},
			{type: 'A', name: 'Battery', rating: 'Veteran', attr: '6lb Horse', size: 6},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: 'Field Battery', rating: 'Elite', attr: '6lb', size: 8},
			{type: 'A', name: 'Horse Battery', rating: 'Elite', attr: '6lb Horse', size: 6},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 8},
		],
	},
	{period: 'Wars of Liberation', nation: 'Prussia', flag: 'prussia1',
		inf: ['Prussian','Landwehr','Jager','Rifles','Grenadier'],
		div: [
			{type: 'X', name: 'First Line'},
			{type: 'I', name: '3 (Fusilier Bn), xx Regt', rating: 'Crack', attr: 'Prussian', size: 900},
			{type: 'I', name: '1 Bn, xx Regt', rating: 'Crack', attr: 'Prussian', size: 900},
			{type: 'I', name: '2 Bn, xx Regt', rating: 'Crack', attr: 'Prussian', size: 700},
			{type: 'X', name: 'Reserve Line'},
			{type: 'I', name: '3 (Fusilier) Bn, xx Reserve Regt', rating: 'Regular', attr: 'Prussian', size: 900},
			{type: 'I', name: '1 Bn, xx Reserve Regt', rating: 'Regular', attr: 'Prussian', size: 900},
			{type: 'I', name: '2 Bn, xx Reserve Regt', rating: 'Regular', attr: 'Prussian', size: 900},
			{type: 'I', name: '1 Landwehr Bn', rating: 'Landwehr', attr: 'Landwehr', size: 900},
			{type: 'I', name: '2 Landwehr Bn', rating: 'Landwehr', attr: 'Landwehr', size: 700},
			{type: 'I', name: '3 Landwehr Bn', rating: 'Landwehr', attr: 'Landwehr', size: 500},
			{type: 'I', name: '4 Landwehr Bn', rating: 'Landwehr', attr: 'Landwehr', size: 400},
			{type: 'X', name: 'Artillery Bty'},
			{type: 'A', name: 'Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
		],
		bde: [
			{type: 'X', name: 'Elite Bde'},
			{type: 'I', name: '1 Bn, xx Regt', rating: 'Grenadier', attr: 'Grenadier', size: 900},
			{type: 'I', name: '2 Bn, xx Regt', rating: 'Grenadier', attr: 'Grenadier', size: 900},
			{type: 'I', name: '3 Bn, xx Regt', rating: 'Grenadier', attr: 'Grenadier', size: 900},
			{type: 'A', name: 'Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'C', name: 'Dragoons', rating: 'Elite', attr: 'Dragoon', size: 450},
			{type: 'C', name: 'Landwehr Cav', rating: 'Landwehr', attr: 'Lancer', size: 450},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Hussars', rating: 'Elite', attr: 'Hussar', size: 450},
			{type: 'C', name: 'Landwehr Cav', rating: 'Landwehr', attr: 'Lancer', size: 450},
			{type: 'C', name: 'Dragoons', rating: 'Crack', attr: 'Dragoon', size: 450},
			{type: 'C', name: 'Cuirassier', rating: 'Guard', attr: 'Cuirassier', size: 450},
			{type: 'A', name: 'Battery', rating: 'Veteran', attr: '6lb Horse', size: 6},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: 'Field Battery', rating: 'Elite', attr: '6lb', size: 8},
			{type: 'A', name: 'Horse Battery', rating: 'Elite', attr: '6lb Horse', size: 6},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 8},
		],
	},
	{period: 'Wars of Liberation', nation: 'Russia', flag: 'russia1813',
		inf: ['Russian','Jager','Grenadier'],
		div: [
			{type: 'X', name: 'Skirmish Line'},
			{type: 'I', name: 'xx Jager', rating: 'Veteran', attr: 'Jager', size: 300},
			{type: 'I', name: 'xx Jager', rating: 'Veteran', attr: 'Jager', size: 300},
			{type: 'I', name: 'xx Jager', rating: 'Veteran', attr: 'Jager', size: 300},
			{type: 'X', name: '1st Line'},
			{type: 'I', name: 'xx Infantry Regt', rating: 'Crack', attr: 'Russian', size: 800},
			{type: 'I', name: 'yy Infantry Regt', rating: 'Regular', attr: 'Russian', size: 800},
			{type: 'X', name: '2nd Line'},
			{type: 'I', name: 'xx Infantry Regt', rating: 'Veteran', attr: 'Russian', size: 800},
			{type: 'I', name: 'xx Infantry Regt', rating: 'Regular', attr: 'Russian', size: 800},
		],
		bde: [
			{type: 'X', name: 'Elite Bde'},
			{type: 'I', name: 'xx Regt', rating: 'Grenadier', attr: 'Grenadier', size: 600},
			{type: 'I', name: 'xx Regt', rating: 'Grenadier', attr: 'Grenadier', size: 600},
			{type: 'I', name: 'xx Regt', rating: 'Grenadier', attr: 'Grenadier', size: 600},
			{type: 'A', name: 'Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'C', name: 'Dragoons', rating: 'Elite', attr: 'Dragoon', size: 450},
			{type: 'C', name: 'Landwehr Cav', rating: 'Landwehr', attr: 'Lancer', size: 450},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Hussars', rating: 'Elite', attr: 'Hussar', size: 450},
			{type: 'C', name: 'Landwehr Cav', rating: 'Landwehr', attr: 'Lancer', size: 450},
			{type: 'C', name: 'Dragoons', rating: 'Crack', attr: 'Dragoon', size: 450},
			{type: 'C', name: 'Cuirassier', rating: 'Guard', attr: 'Cuirassier', size: 450},
			{type: 'A', name: 'Battery', rating: 'Veteran', attr: '6lb Horse', size: 6},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: 'Field Battery', rating: 'Elite', attr: '6lb', size: 8},
			{type: 'A', name: 'Horse Battery', rating: 'Elite', attr: '6lb Horse', size: 6},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 8},
		],
	},
	{period: 'Wars of Liberation', nation: 'Austria', flag: 'austria',
		inf: ['Austrian','Landwehr','Grenadier','Jager','Grenzer'],
		div: [
			{type: 'X', name: '1st Bde'},
			{type: 'I', name: '1st Bn xx Regt', rating: 'Crack', attr: 'Austrian', size: 600},
			{type: 'I', name: '2nd Bn xx Regt', rating: 'Crack', attr: 'Austrian', size: 600},
			{type: 'I', name: 'Jager Bn', rating: 'Elite', attr: 'Rifles', size: 200},
			{type: 'I', name: 'Light Bn', rating: 'Regular', attr: 'Fusilier', size: 400},
			{type: 'X', name: '2nd Bde'},
			{type: 'I', name: '1st Bn yy Regt', rating: 'Veteran', attr: 'Austrian', size: 400},
			{type: 'I', name: '2nd Bn yy Regt', rating: 'Regular', attr: 'Austrian', size: 600},
			{type: 'I', name: '3rd Bn yy Regt', rating: 'Regular', attr: 'Austrian', size: 600},
			{type: 'X', name: '3rd Bde'},
			{type: 'I', name: '1st Bn zz Regt', rating: 'Conscript', attr: 'Austrian', size: 800},
			{type: 'I', name: '2nd Bn zz Regt', rating: 'Conscript', attr: 'Austrian', size: 800},
			{type: 'I', name: '3rd Bn zz Regt', rating: 'Conscript', attr: 'Austrian', size: 800},
			{type: 'X', name: 'Artillery'},
			{type: 'A', name: 'Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
		],
		bde: [
			{type: 'X', name: 'Elite Bde'},
			{type: 'I', name: 'xx Grenzer', rating: 'Veteran', attr: 'Grenzer', size: 600},
			{type: 'I', name: 'xx Grenzer', rating: 'Regular', attr: 'Grenzer', size: 400},
			{type: 'I', name: 'xx Jager Bn', rating: 'Veteran', attr: 'Rifles', size: 300},
			{type: 'I', name: 'xx Jager Bn', rating: 'Regular', attr: 'Jager', size: 200},
			{type: 'I', name: 'xx Gren Bn', rating: 'Grenadier', attr: 'Grenadier', size: 600},
			{type: 'I', name: 'xx Gren Bn', rating: 'Grenadier', attr: 'Grenadier', size: 600},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Elite', attr: 'Hussar', size: 400},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Chasseur', size: 400},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Crack', attr: 'Dragoon', size: 600},
			{type: 'C', name: 'Heavy Cavalry', rating: 'Grenadier', attr: 'Cuirassier', size: 600},
			{type: 'A', name: 'Horse Artillery Bty', rating: 'Elite', attr: '6lb Horse', size: 6},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: '1st Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: '2nd Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 6},
		],
	},

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// 100 Days Campaign
	//		French, British, Prussian, DutchBelgian, Austrian, Russian, Bavarian, Swiss, Naples, French Kingdom, Spain, Portugal, Sardinia

	{period: '100 Days Campaign', nation: 'France', flag: 'france1812',
		inf: ['Ligne','Legere','Guard','Provisional','Marine'],
		div: [
			{type: 'X', name: 'Light Bde'},
			{type: 'I', name: '1e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
			{type: 'I', name: '2e Bn, xx Legere', rating: 'Veteran', attr: 'Legere', size: 700},
			{type: 'I', name: '3e Bn, xx Legere', rating: 'Veteran', attr: 'Legere', size: 700},
			{type: 'X', name: '1st Line Bde'},
			{type: 'I', name: '1e Bn, xx Ligne', rating: 'Veteran', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, xx Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '1e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'X', name: '2nd Line Bde'},
			{type: 'I', name: '1e Bn, xx Ligne', rating: 'Veteran', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, xx Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '1e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'X', name: 'Artillery Bty'},
			{type: 'A', name: 'Field Battery', rating: 'Elite', attr: '6lb', size: 8},
		],
		bde: [
			{type: 'X', name: 'Light Bde'},
			{type: 'I', name: '1e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
			{type: 'I', name: '2e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
			{type: 'I', name: '3e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Elite', attr: 'Chasseur', size: 300},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Chasseur', size: 300},
			{type: 'C', name: 'Dragoons', rating: 'Crack', attr: 'Dragoon', size: 300},
			{type: 'A', name: 'Battery', rating: 'Veteran', attr: '6lb Horse', size: 6},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: 'Field Battery', rating: 'Elite', attr: '6lb', size: 8},
			{type: 'A', name: 'Horse Battery', rating: 'Elite', attr: '6lb Horse', size: 6},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 8},
		],
	},
	{period: '100 Days Campaign', nation: 'Britain', flag: 'britain',
		inf: ['British','Guard','Rifles','Fusilier'],
		div: [
			{type: 'X', name: 'Light Bde'},
			{type: 'I', name: '1e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
			{type: 'I', name: '2e Bn, xx Legere', rating: 'Veteran', attr: 'Legere', size: 700},
			{type: 'I', name: '3e Bn, xx Legere', rating: 'Veteran', attr: 'Legere', size: 700},
			{type: 'X', name: '1st Line Bde'},
			{type: 'I', name: '1e Bn, xx Ligne', rating: 'Veteran', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, xx Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '1e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'X', name: '2nd Line Bde'},
			{type: 'I', name: '1e Bn, xx Ligne', rating: 'Veteran', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, xx Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '1e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'X', name: 'Artillery Bty'},
			{type: 'A', name: 'Field Battery', rating: 'Elite', attr: '6lb', size: 8},
		],
		bde: [
			{type: 'X', name: 'Light Bde'},
			{type: 'I', name: '1e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
			{type: 'I', name: '2e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
			{type: 'I', name: '3e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Elite', attr: 'Chasseur', size: 300},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Chasseur', size: 300},
			{type: 'C', name: 'Dragoons', rating: 'Crack', attr: 'Dragoon', size: 300},
			{type: 'A', name: 'Battery', rating: 'Veteran', attr: '6lb Horse', size: 6},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: 'Field Battery', rating: 'Elite', attr: '6lb', size: 8},
			{type: 'A', name: 'Horse Battery', rating: 'Elite', attr: '6lb Horse', size: 6},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 8},
		],
	},
	{period: '100 Days Campaign', nation: 'Prussia', flag: 'prussia1',
		inf: ['Prussian','Landwehr','Jager','Rifles','Grenadier'],
		div: [
			{type: 'X', name: 'First Line'},
			{type: 'I', name: '3 (Fusilier Bn), xx Regt', rating: 'Crack', attr: 'Prussian', size: 900},
			{type: 'I', name: '1 Bn, xx Regt', rating: 'Crack', attr: 'Prussian', size: 900},
			{type: 'I', name: '2 Bn, xx Regt', rating: 'Crack', attr: 'Prussian', size: 700},
			{type: 'X', name: 'Reserve Line'},
			{type: 'I', name: '3 (Fusilier) Bn, xx Reserve Regt', rating: 'Regular', attr: 'Prussian', size: 900},
			{type: 'I', name: '1 Bn, xx Reserve Regt', rating: 'Regular', attr: 'Prussian', size: 900},
			{type: 'I', name: '2 Bn, xx Reserve Regt', rating: 'Regular', attr: 'Prussian', size: 900},
			{type: 'I', name: '1 Landwehr Bn', rating: 'Landwehr', attr: 'Landwehr', size: 900},
			{type: 'I', name: '2 Landwehr Bn', rating: 'Landwehr', attr: 'Landwehr', size: 700},
			{type: 'I', name: '3 Landwehr Bn', rating: 'Landwehr', attr: 'Landwehr', size: 500},
			{type: 'I', name: '4 Landwehr Bn', rating: 'Landwehr', attr: 'Landwehr', size: 400},
			{type: 'X', name: 'Artillery Bty'},
			{type: 'A', name: 'Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
		],
		bde: [
			{type: 'X', name: 'Elite Bde'},
			{type: 'I', name: '1 Bn, xx Regt', rating: 'Grenadier', attr: 'Grenadier', size: 900},
			{type: 'I', name: '2 Bn, xx Regt', rating: 'Grenadier', attr: 'Grenadier', size: 900},
			{type: 'I', name: '3 Bn, xx Regt', rating: 'Grenadier', attr: 'Grenadier', size: 900},
			{type: 'A', name: 'Field Battery', rating: 'Veteran', attr: '6lb', size: 8},
			{type: 'C', name: 'Dragoons', rating: 'Elite', attr: 'Dragoon', size: 450},
			{type: 'C', name: 'Landwehr Cav', rating: 'Landwehr', attr: 'Lancer', size: 450},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Hussars', rating: 'Elite', attr: 'Hussar', size: 450},
			{type: 'C', name: 'Landwehr Cav', rating: 'Landwehr', attr: 'Lancer', size: 450},
			{type: 'C', name: 'Dragoons', rating: 'Crack', attr: 'Dragoon', size: 450},
			{type: 'C', name: 'Cuirassier', rating: 'Guard', attr: 'Cuirassier', size: 450},
			{type: 'A', name: 'Battery', rating: 'Veteran', attr: '6lb Horse', size: 6},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: 'Field Battery', rating: 'Elite', attr: '6lb', size: 8},
			{type: 'A', name: 'Horse Battery', rating: 'Elite', attr: '6lb Horse', size: 6},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 8},
		],
	},

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// India
	//		French, British, Tribes, East India Company, Sepoy, Maharatta

	{period: 'India', nation: 'France', flag: 'france1812',
		inf: ['Linear','Fusilier','Jager','Grenadier'],
		div: [
			{type: 'X', name: 'Light Bde'},
			{type: 'I', name: '1e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
			{type: 'I', name: '2e Bn, xx Legere', rating: 'Veteran', attr: 'Legere', size: 700},
			{type: 'I', name: '3e Bn, xx Legere', rating: 'Veteran', attr: 'Legere', size: 700},
			{type: 'X', name: '1st Line Bde'},
			{type: 'I', name: '1e Bn, xx Ligne', rating: 'Veteran', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, xx Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '1e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'X', name: '2nd Line Bde'},
			{type: 'I', name: '1e Bn, xx Ligne', rating: 'Veteran', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, xx Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '1e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'I', name: '2e Bn, yy Ligne', rating: 'Regular', attr: 'Ligne', size: 700},
			{type: 'X', name: 'Artillery Bty'},
			{type: 'A', name: 'Field Battery', rating: 'Elite', attr: '6lb', size: 8},
		],
		bde: [
			{type: 'X', name: 'Light Bde'},
			{type: 'I', name: '1e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
			{type: 'I', name: '2e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
			{type: 'I', name: '3e Bn, xx Legere', rating: 'Elite', attr: 'Legere', size: 700},
		],
		cav: [
			{type: 'X', name: 'Cav Bde'},
			{type: 'C', name: 'Light Cavalry', rating: 'Elite', attr: 'Chasseur', size: 300},
			{type: 'C', name: 'Light Cavalry', rating: 'Crack', attr: 'Chasseur', size: 300},
			{type: 'C', name: 'Dragoons', rating: 'Crack', attr: 'Dragoon', size: 300},
			{type: 'A', name: 'Battery', rating: 'Veteran', attr: '6lb Horse', size: 6},
		],
		art: [
			{type: 'X', name: 'Artillery Bde Commander'},
			{type: 'A', name: 'Field Battery', rating: 'Elite', attr: '6lb', size: 8},
			{type: 'A', name: 'Horse Battery', rating: 'Elite', attr: '6lb Horse', size: 6},
			{type: 'A', name: 'Heavy Battery', rating: 'Elite', attr: '12lb', size: 8},
		],
	},

]

var findForce = function(period, nation) {
	print('findForce',period,nation)
	var p = db.nation.find({period: period, nation: nation}).next()
	return p._id
}

print('Adding Force Templates')
db.force.remove({})
_id = 1
forces.forEach(function(data){
	data._id = _id++
	_period = data.period
	data.period = findPeriodCode(data.period)
	var newInf = []
	data.inf.forEach(function(f){
		newInf.push(findInfantry(f))
	})
	data.inf = newInf
	data.div.forEach(function(f){
		print(_period, data.nation)
		if (f.rating) { f.rating = findRating(f.rating) }
		switch(f.type) {
			case 'X':
				if (f.attr === undefined) {
					f.attr = findCmd('Brigadier')
				} else {
					f.attr = findCmd(f.attr)
				}
				break
			case 'I':
				f.attr = findInfantry(f.attr)
				break
			case 'C':
				f.attr = findCav(f.attr)
				break
			case 'A':
				f.attr = findGun(f.attr)
				break
		}
		printjson(f)
	})
	data.bde.forEach(function(f){
		if (f.rating) { f.rating = findRating(f.rating) }
		switch(f.type) {
			case 'X':
				if (f.attr === undefined) {
					f.attr = findCmd('Light Infantry General')
				} else {
					f.attr = findCmd(f.attr)
				}
				break
			case 'I':
				f.attr = findInfantry(f.attr)
				break
			case 'C':
				f.attr = findCav(f.attr)
				break
			case 'A':
				f.attr = findGun(f.attr)
				break
		}
		printjson(f)
	})
	data.cav.forEach(function(f){
		if (f.rating) { f.rating = findRating(f.rating) }
		switch(f.type) {
			case 'X':
				if (f.attr === undefined) {
					f.attr = findCmd('Cavalry General')
				} else {
					f.attr = findCmd(f.attr)
				}
				break
			case 'I':
				f.attr = findInfantry(f.attr)
				break
			case 'C':
				f.attr = findCav(f.attr)
				break
			case 'A':
				f.attr = findGun(f.attr)
				break
		}
		printjson(f)
	})
	data.art.forEach(function(f){
		if (f.rating) { f.rating = findRating(f.rating) }
		switch(f.type) {
			case 'X':
				if (f.attr === undefined) {
					f.attr = findCmd('Artillery General')
				} else {
					f.attr = findCmd(f.attr)
				}
				break
			case 'I':
				f.attr = findInfantry(f.attr)
				break
			case 'C':
				f.attr = findCav(f.attr)
				break
			case 'A':
				f.attr = findGun(f.attr)
				break
		}
		printjson(f)
	})
	db.force.insert(data)
})
endSection()
