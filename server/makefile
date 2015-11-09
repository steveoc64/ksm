all: clean html assets css js
	mkdir ../www
	cp -r app/* ../www
	cp ../app/scripts/config-production.js ../www/js/config.js
	du app
	~/audios/playrand

clean:
	echo Cleaning All Files .............
	rm -rf app ../www
	mkdir -p \
		app/battles \
		app/flags \
		app/fonts \
		app/icons \
		app/images \
		app/css \
		app/js \
		app/templates \
		app/images \
		app/troops \
		app/manuals \
		app/css/images 

assets: 
	echo Building Assets ................
	cp ../app/battles/compressed/*.jpg app/battles
	cp ../app/flags/*.jpg app/flags
	cp ../app/fonts/* app/fonts
	cp ../app/icons/*.png app/icons
	cp ../app/images/*.png app/images
	cp ../app/lib/leaflet/dist/images/layers.png app/css/images
	cp ../app/images/compressed/* app/images
	cp ../app/troops/*.jpg app/troops
	cp ../app/scripts/config.js app/js

html:
	echo Building HTML files ............
	cp ../app/templates/*.html app/templates
	cp ../app/kriegspiel.html app/index.html
	cp ../app/manuals/*.html app/manuals

css:
	echo Compiling CSS .................
	cat \
		../app/lib/ionic/release/css/ionic.css \
		../app/lib/leaflet/dist/leaflet.css \
		../app/lib/font-awesome/css/font-awesome.css \
		../app/lib/Leaflet.label/dist/leaflet.label.css \
		../app/styles/main.css \
		> app/css/ks.css
	du app/css

js:
	echo Compiling JS ...................
	cp ../app/lib/ionic/release/js/ionic.bundle.min.js app/js
	cp ../app/lib/jquery/dist/jquery.min.js app/js
	cp ../app/scripts/config-development.js app/js/config.js
	cat \
		../app/lib/leaflet/dist/leaflet-src.js \
		../app/lib/angular-leaflet-directive/dist/angular-leaflet-directive.js \
		../app/lib/Leaflet.label/dist/leaflet.label-src.js \
		../app/lib/ngstorage/ngStorage.js \
		../app/lib/angular-order-object-by/src/ng-order-object-by.js \
		| uglifyjs -c warnings=false -m > app/js/ks1.js
	cat \
		../app/scripts/app.js \
		../app/scripts/controllers.js \
		../app/scripts/services.js \
		| uglifyjs -m -c warnings=false > app/js/ks2.js
	du app/js

hint:
	echo JSHinting the source code ................
	jshint ../app/scripts/*.js

release:
	echo Building Release Bundle ..................
	tar cfj ~/KSM/ksm-release.tbj .
	ls -ltra ~/KSM/ksm-release.tbj

fullupload: release
	echo Uploading FULL Build to remote server .....
	scp ~/KSM/ksm-release.tbj steve@la-musette.net:/home/steve
	echo Logging in to remote server .. you need to kill existing and relaunch
	ssh la-musette.net

upload: release
	echo Uploading Application Build to remote server .....
	scp app/js/ks2.js steve@la-musette.net:/home/steve/ks/app/js
	scp app/templates/* steve@la-musette.net:/home/steve/ks/app/templates
	scp app/index.html steve@la-musette.net:/home/steve/ks/app/
	echo New application changes loaded to remote, refresh and run 


#		../app/lib/jquery/dist/jquery.js \

