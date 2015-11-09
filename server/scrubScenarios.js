
var endSection = function() {
	print('=========================================================================')
}

// Connect to the database
db = connect('localhost/kriegsspiel')
endSection()

db.slots.remove({})
db.maps.remove({})
print('Scrubbed all slots and maps')

endSection()