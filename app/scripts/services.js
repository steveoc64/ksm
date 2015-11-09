//=============================================================================================================================
// Padding function to get numeric _id fields into strings which are correctly sortable

function pad(number, length) {

  var str = ''+number
  while (str.length < length) {
    str = '0'+str
  }
  return str
} 

angular.module('KSMapper.services', [])


//=============================================================================================================================
// $token
//  check()
//  get()
//  
//  JWT style token that is used for all authentication. Stored in localstorage at the client end only.
//  Has embedded expiry date

.factory('$token', [
  '$http',
  '$log',
  '$q',
  '$state', 
  '$localStorage',
  'ENV',
  function(
    $http, 
    $log, 
    $q, 
    $state,
    $localStorage,
    ENV
  ){

  console.log('token init',ENV.name, ENV.SERVER)

  return {
    check: function() {

      var token = $localStorage.token
      var deferred = $q.defer()

      if (angular.isDefined(token) && token !== null) {
        $http.post(ENV.SERVER+'/token', {token: token})
          .success(function(reason,status) {
            deferred.resolve(status)
          }).error(function(reason,status) {
            $log.error('Token failed',reason,status)
            delete $localStorage.token
            delete $localStorage.lookups
            deferred.reject(status)
            $state.go('login')
          })
      } else {
          deferred.reject(404)
          $state.go('login')
      }

      return deferred.promise
    },
    get: function() {
      return $localStorage.token
    }
  }
}])

//=============================================================================================================================
// $login
//  login()
//  register()
//  update()
//  forgot()
//  
//  Perform all authentication and user registration with the backend ENV.SERVER
//  On a successful login, sets a new JWT token as passed from the backend ENV.SERVER

.factory('$login', [
  '$http',
  '$log',
  '$q', 
  '$token', 
  '$localStorage',
  '$lookup',
  'ENV',
  function(
    $http, 
    $log, 
    $q, 
    $token, 
    $localStorage,
    $lookup,
    ENV
  ){

  return {
    loggedin: false,
    admin: false,
    username: "",
    credit: 0,
    scenarios: 0,

    ensureLoggedin: function() {
      if (!this.loggedin) {
        //console.log('Not logged in - try to login again',$localStorage.user)
        return this.login($localStorage.user.email, $localStorage.user.password)
      }
      var deferred = $q.defer()
      deferred.resolve(1)
      return deferred.promise
    },
    login: function(email, password) {
      var self = this
      var deferred = $q.defer()

      $http.post(ENV.SERVER+'/login', {email: email, password: password})
        .success(function(data,status) {
          $localStorage.token = data.TokenString

          // Now decode the lookup data
          var l = data.Lookups
          $lookup.loadData(l)

          // Now decode the user data
          self.username = data.Username
          self.credit = data.Credit
          self.admin = data.Admin
          self.scenarios = data.Scenarios
          self.loggedin = true

          console.log('logged in with user',self.username,'admin mode',self.admin)
          deferred.resolve(status)
        }).error(function(data,status) {
          $log.error('login error',data,status)
          delete $localStorage.token
          deferred.reject(status)
        })
      return deferred.promise
    },
    register: function(user) {
      var deferred = $q.defer()

      $http.post(ENV.SERVER+'/register', user).success(function(data,status) {
        $localStorage.user = user
        deferred.resolve(data)
      }).error(function(data,status) {
        deferred.reject(data)
      })
      return deferred.promise
    },
    update: function(user) {
      var deferred = $q.defer()

      $http.post(ENV.SERVER+'/updateuser', {
        token: $localStorage.token,
        user: user,
      }).success(function(data,status) {
        $localStorage.user = user
        deferred.resolve(data)
      }).error(function(data,status) {
        deferred.reject(data)
      })
      return deferred.promise
    },
    forgot: function(email) {
      var deferred = $q.defer()

      $http.post(ENV.SERVER+'/forgot', {Email: email}).success(function(data,status) {
        deferred.resolve(data)
      }).error(function(data, status) {
        deferred.reject(data)
      })
      return deferred.promise
    },
  }
}])

//=============================================================================================================================
// $slots
//  get()
//  
//  Get a list of map file Slots from the backend ENV.SERVER

.factory('$slots', [
  '$log', 
  '$token', 
  '$q', 
  '$http', 
  'ENV',
  function(
    $log, 
    $token, 
    $q, 
    $http,
    ENV
  ){

  return {
    slots: [],
    load: function() { // return an array of slots available to this user
      var self = this
      $http.post(ENV.SERVER+'/scenarios', {token: $token.get()})
        .success(function(data,status) {
          //$log.info("loaded slots:",data)
          self.slots = data
        })
    }
  }
}])

//=============================================================================================================================
// $armies
//  
//  Static array of the different colors / armies available

.factory('$armies', 
  function() {

  return [
    {name: 'Blue', rgb: '#33f', class: 'positive'},
    {name: 'Red', rgb: '#f33', class: 'assertive'},
    {name: 'Black', rgb: '#000', class: 'dark'},
    {name: 'White', rgb: '#aaa', class: 'stable'},
    {name: 'Green', rgb: '#080', class: 'balanced'},
    {name: 'Yellow', rgb: '#880', class: 'energized'},
    {name: 'LtBlue', rgb: '#38f', class: 'calm'},
    {name: 'Purple', rgb: '#86e', class: 'royal'},
  ]  
})

//=============================================================================================================================
// $lookup
//  
//  Static arrays of different lookup tables

.factory('$lookup', [
  '$http',
  '$q',
  '$token',
  '$localStorage',
  '$log',
  'ENV',
  function(
    $http,
    $q,
    $token,
    $localStorage,
    $log,
    ENV
  ){

    return {
      inited: false,
      rating: {},
      period: [],
      inf: {},
      cmd: {},
      cav: {},
      gun: {},
      gw: {
        1: 'Fast',
        2: 'Very Mobile',
        3: 'Mobile',
        4: 'Slow',
        5: 'Very Slow and Heavy',
        6: 'Immobile'
      },
      forces: {},
      getPeriod: function(code) {
        var retval = null
        var self = this
        angular.forEach(self.period, function(v) {
          if (v.code === code) {
            retval = v
          }
        }, self)
        return retval
      },
      describePeriod: function(code) {
        if (code === '' || code === null) {
          return ''
        }
        var p = this.getPeriod(code)
        if (p) {
          return p.name + ' ... '+p.from+'-'+p.to
        }
        return ''
      },
      getForces: function(period) {
        //console.log('getting forces for',period)
        var self = this
        $http.post(ENV.SERVER+'/forces', {token: $token.get(), period: period})
          .success(function(data,status) {
            //console.log('forces returns',data)
            self.forces = data
            $localStorage.force = data
          })         
      },
      getFlag: function(nation) {
        var self = this
        var retval = null
        angular.forEach(self.forces, function(v) {
          if (v.Nation === nation) {
            retval = v.Flag
          }
        }, self)
        return retval
      },
      loadData: function(data) {
        var self = this

        angular.forEach(data.Ratings, function(v) {
          self.rating[v.Id] = {
            name: v.Name
          }
        },self)

        self.period = []
        angular.forEach(data.Periods, function(v) {
          self.period.push({
            code: v.Code,
            name: v.Name,
            from: v.From,
            to: v.To,
            lat: v.Lat,
            lng: v.Lng
          })
        },self)

        angular.forEach(data.Infs, function(v) {
          self.inf[v.Id] = {
            name: v.Name,
            desc: v.Desc,
            bases: v.Bases,
            ranks: v.Ranks,
            fire: v.Fire,
            bayonet: v.Bayonet,
            shock: v.Shock,
            rifle: v.Rifle,
            image: v.Image
          }
        },self)

        angular.forEach(data.Cavs, function(v) {
          self.cav[v.Id] = {
            name: v.Name,
            cr: v.Cr,
            sk: v.Sk,
            lance: v.Lance,
            scout: v.Scout,
            cossack: v.Cossack,
            dismount: v.Dismount,
            image: v.Image
          }
        })

        angular.forEach(data.Guns, function(v) {
          self.gun[v.Id] = {
            name: v.Name,
            desc: v.Desc,
            calibre: v.Calibre,
            weight: v.Weight,
            horse: v.Horse,
            HW: v.HW,
            rc: v.Rc,
            rs: v.Rs,
            rr: v.Rr,
            image: v.Image
          }
        })

        angular.forEach(data.Cmds, function(v) {
          self.cmd[v.Id] = {
            name: v.Name,
            image: v.Image
          }
        })

        angular.forEach(data.Forces, function(v) {
          self.force[v.Id] = {
            period: v.Period,
            nation: v.Nation,
            inf: v.Inf,
            div: v.Div,
            bde: v.Bde,
            cav: v.Cav,
            art: v.Art
          }
        })

        // Save to LocalStorage to save future lookups
        $localStorage.lookups = true
        $localStorage.rating = self.rating
        $localStorage.period = self.period
        $localStorage.inf = self.inf
        $localStorage.cav = self.cav
        $localStorage.gun = self.gun
        $localStorage.cmd = self.cmd
        $localStorage.force = self.force

        this.inited = true
      },
      init: function() {
        //console.log('lookup init',this.inited)
        if (!this.inited) {
          this.inited = true

          if ($localStorage.lookups) {
            //console.log('Getting lookups from localStorage')
            this.rating = $localStorage.rating
            this.period = $localStorage.period
            this.inf = $localStorage.inf
            this.cav = $localStorage.cav
            this.cmd = $localStorage.cmd
            this.gun = $localStorage.gun
            this.force = $localStorage.force
          } else {
            // Need to go to the backend and get a fresh list of lookups
            var self = this
            var deferred = $q.defer()

           $http.post(ENV.SERVER+'/lookups', {token: $token.get()})
              .success(function(data,status) {
                self.loadData(data)
                deferred.resolve(data)
              }).error(function(data,status) {
                $log.error('Failed to get Lookups',data,status)
                deferred.reject(data)
              })

          }
        } // if !inited
      } // init fn
    }

}])

//=============================================================================================================================
// $battleScenes
//  
//  Static array of different images to be used for battles !

.factory('$battleScenes', 
  function() {

  return ['1','2','3','4','5','6','7','8','9','10','11',
  'hanau','paris','paris-mob','brienne','waterloo','waterloo2','battlefield',
  'bagration','borodino','waterloo3','friedland','russia',
  'wagram','kgl','eylau','ship','jena','guns','guard','russo-turkish1800','russo-iranwar',
  'pyramids','80yw01','rev00','rev01','rev02','rev03','rev04','syw01','syw02','syw03','syw04','syw05','syw06',
  'arcola','nyw02','liberty','nyw01']
})

//=============================================================================================================================
// $scenario
//  initScenario()
//  newScenario()
//  getArmy()
//  setSelection(color,lvl)
//  clearSelection()
//  objMode(x,color)
//  addUnit(color,lvl,lat,lng)
//  addObjective(color,lat,lng)
//  dragObjective(marker,latlng)
//  dragUnit(marker,latlng)
//  click(marker)
//  connectObj(oFrom,oTo)
//  deleteUnit(unit)
//  deleteObj(obj)
//  disconnectObjective(obj)
//  generateObjPaths()
//  convertUnitToSave(unit)
//  convertUnitFromSave(color,data)
//  convertObjToSave(obj)
//  convertObjFromSave(obj)
//  save(slot,mapSaveReq)
//  load(slot)
//  unwind(data)
//  getMarkers()
//  getParentDistance(unit)


.factory('$scenario', [
  '$log', 
  '$icons', 
  '$token', 
  '$q', 
  '$http', 
  '$slots', 
  '$armies',
  '$localStorage',
  '$lookup',
  'ENV',
  function(
    $log, 
    $icons, 
    $token, 
    $q, 
    $http, 
    $slots, 
    $armies,
    $localStorage,
    $lookup,
    ENV
  ){

  $icons.init()

  return {
    file: {
      name: '',
      year: '',
      season: '',
      period: '',
      image: 'default',
    },
    changed: false,
    type: null,
    level: null,
    color: null,
    units: {},
    HQ: {},
    Corps: {},
    objs: [],   // straight array
    nextObjId: 1,
    nextUnitId: {},
    nextCav: 'DRG',
    nextGun: '6lb',
    oMode: 'New',
    oColor: 'GoldObjective',
    lastObj: null,
    markers: {},
    paths: {  // Just start off with ObjPaths ... more paths get added as we add Army types
      objPaths: {
        type: 'multiPolyline',
        color: '#941',
        opacity: 0.3,
        weight: 5,
        layer: 'objective',
        latlngs: [],        
      },
      gunShortRange: {
        type: 'circle',
        color: '#f20',
        weight: 3,
        radius: 600,
        latlngs: {lat: 0, lng: 0},
      },
      gunLongRange: {
        type: 'circle',
        color: '#f62',
        weight: 3,
        radius: 1800,
        latlngs: {lat: 0, lng: 0},
      }
    },

    // The purppse of this function is to extend the $scenario structure at runtime, to
    // accomodate any new army definitions (colors) dynamically.
    initScenario: function() {

      angular.forEach($armies, function(army) {
        if (angular.isUndefined(this.units[army.name])) {
          this.units[army.name] = []
        }

        if (angular.isUndefined(this.paths[army.name])) {
          this.paths[army.name] = {
            type: 'multiPolyline',
            color: army.rgb,
            opacity: 0.4,
            weight: 4,
            layer: 'strategic',
            latlngs: [],
          }          
        }
      }, this)

      this.newScenario()
    },

    // Initialise the units and paths and objective arrays, push any old data off to be GC'ed
    newScenario: function() {

//      console.log('newScenario')
      this.markers = {}

      // zap the units and their paths
      angular.forEach($armies, function(army) {
        //console.log(army)
        this.units[army.name] = []
        this.paths[army.name].latlngs = []        
        this.nextUnitId[army.name] = 1
      }, this)

      // zap the objectives and their paths
      this.objs = []
      this.paths.objPaths.latlngs = []
    },
    createScenario: function(file) {

      //console.log('createScenario',file)
      this.initScenario()

      // Now copy the file structure into the scenario
      this.file.name = file.name
      this.file.period = file.period
      this.file.year = file.year
      this.file.season = file.season
    },
    getArmy: function() {
      var _a = null,
          _c = this.color

      if (_c) {
        angular.forEach($armies, function(v,k) {
          if (v.name == _c)
            _a = v
        })
      }
      return _a
    },
    setSelection: function(color, lvl) {
      this.color = color
      this.level = lvl
    },
    clearSelection: function() {
      angular.forEach (this.colors, function(rgb,color) {
        this.HQ[color] = this.Corps[color] = null
      },this)
      //this.color = null
      this.lvl = 0
    },
    objMode: function(x,color) {
      this.oMode = x
      this.oColor = color
      this.lastObj = null
    },
    addUnit: function(color,lvl,lat,lng) {
      if (angular.isUndefined(this.units[color])) {
        this.initScenario()
      }

      var cid = this.nextUnitId[color]
      var id = color + cid
      this.nextUnitId[color]++

      var _layer = 'tactical'
      switch (lvl) {
        case 'HQ':
        case 'Corps':
          _layer = 'strategic'
          break
      }

      var newUnit = {
        type: 'U',
        lvl: lvl,
        icon: $icons[color][lvl],
        lat: lat,
        lng: lng,
        focus: false,
        draggable: true,
        layer: _layer,
        color: color,
        id: id,         
        parent: null,
        label: {
          message: color+' Force #'+cid,
          options: {
            noHide: true,
            offset: [2,2],
            opacity: 0.9,
          }
        }                            
      }

      // Add optional fields, and setup the chain of command
      var _parent = null
      switch(lvl) {
        case 'HQ':
          this.HQ[color] = id
          newUnit.parent = null
          this.level = 'Corps'
          break
        case 'Corps':
          newUnit.cmd = ''
          newUnit.skill = '5'
          newUnit.logistics = '50'
          newUnit.vigour = '50'
          newUnit.initiative = '50'
          this.Corps[color] = id
          newUnit.parent = this.HQ[color]
          _parent = this.markers[newUnit.parent]
          newUnit.nation = _parent.nation
          break
        case 'Div':
          newUnit.cmd = ''
          newUnit.skill = '5'
          newUnit.vigour = '50'
          newUnit.parent = this.Corps[color]
          if (newUnit.parent) {
            _parent = this.markers[newUnit.parent]
            newUnit.skill = _parent.skill
            newUnit.vigour = _parent.vigour            
            newUnit.nation = _parent.nation
          }

//          console.log('Generate Div sub units for', newUnit.nation, this.file.period)
          newUnit.sub = []
          angular.forEach ($lookup.forces, function(f) {
            if (f.Period === this.file.period && f.Nation === newUnit.nation) {
              angular.copy(f.Div, newUnit.sub)
            }
          }, this)
          break
        case 'Bde':
          newUnit.cmd = ''
          newUnit.skill = '5'
          newUnit.vigour = '50'
          newUnit.parent = this.Corps[color]
          if (newUnit.parent) {
            _parent = this.markers[newUnit.parent]
            newUnit.skill = _parent.skill
            newUnit.vigour = _parent.vigour            
            newUnit.nation = _parent.nation
          }
//          console.log('Generate Bde sub units for', newUnit.nation, this.file.period)
          newUnit.sub = []
          angular.forEach ($lookup.forces, function(f) {
            if (f.Period === this.file.period && f.Nation === newUnit.nation) {
              angular.copy(f.Bde, newUnit.sub)
            }
          }, this)
          break
        case 'Gun':
          newUnit.cmd = ''
          newUnit.skill = '5'
          newUnit.logistics = '50'
          newUnit.guns = this.nextGun
          newUnit.parent = this.Corps[color]
          if (newUnit.parent) {
            _parent = this.markers[newUnit.parent]
            newUnit.skill = _parent.skill
            newUnit.logistics = _parent.logistics            
            newUnit.nation = _parent.nation
          }
//          console.log('Generate Art sub units for', newUnit.nation, this.file.period)
          newUnit.sub = []
          angular.forEach ($lookup.forces, function(f) {
            if (f.Period === this.file.period && f.Nation === newUnit.nation) {
              angular.copy(f.Art, newUnit.sub)
            }
          }, this)
          break
        case 'Cav':
          newUnit.cmd = ''
          newUnit.skill = '5'
          newUnit.initiative = '50'
          newUnit.cav = this.nextCav 
          newUnit.parent = this.Corps[color]
          if (newUnit.parent) {
            _parent = this.markers[newUnit.parent]
            newUnit.skill = _parent.skill
            newUnit.initiative = _parent.initiative            
            newUnit.nation = _parent.nation
          }
//          console.log('Generate Cav sub units for', newUnit.nation, this.file.period)
          newUnit.sub = []
          angular.forEach ($lookup.forces, function(f) {
            if (f.Period === this.file.period && f.Nation === newUnit.nation) {
              angular.copy(f.Cav, newUnit.sub)
            }
          }, this)
          break
      }

      this._matchRangeMarker(newUnit)

      // push it onto the units[color] array
      this.units[color].push(newUnit)

      // Push onto the markers array as well
      this.markers[newUnit.id] = newUnit

      // And update the paths, if this new unit has a parent
      if (newUnit.parent) {
        var newPath = [ this.markers[newUnit.id], this.markers[newUnit.parent] ]
        this.paths[color].latlngs.push(newPath)
      }

      //console.log('CC1')
      this.changed = true
      return newUnit
    },
    addObjective: function(Color,lat,lng) {
      var id = this.nextObjId
      this.nextObjId++

      var newObjective = {
        type: 'O',
        icon: $icons[Color],
        lat: lat,
        lng: lng,
        focus: false,
        draggable: true,
        opacity: 0.6,
        layer: 'objective',
        color: Color,
        id: id,
        connections: [],
        name: 'Objective #'+id,
      }

      this.objs.push(newObjective)
      this.lastObj = newObjective

      // Push onto the markers array as well
      this.markers['O'+id] = newObjective
    //console.log('CC2')
      this.changed = true

      return newObjective
    },
    dragObjective: function(marker,latlng) {
      marker.lat = latlng.lat 
      marker.lng = latlng.lng 
    //console.log('CC3')
      this.changed = true
    },
    dragUnit: function(marker,latlng) {
      this._matchRangeMarker(marker)
      this.paths.gunShortRange.latlngs = latlng
      this.paths.gunLongRange.latlngs = latlng
      marker.lat = latlng.lat 
      marker.lng = latlng.lng 
      this.getParentDistance(marker)
    //console.log('CC4')
      this.changed = true
    },
    _hideRangeMarker: function() {
      this.paths.gunShortRange.latlngs = [0,0]
      this.paths.gunLongRange.latlngs = [0,0]
      this.paths.gunShortRange.radius = 200
      this.paths.gunLongRange.radius = 600
    },
    _matchRangeMarker: function(unit) {
      this.paths.gunShortRange.latlngs = unit
      this.paths.gunLongRange.latlngs = unit

      switch (unit.lvl) {
        case 'HQ':
        case 'Corps':
          this.paths.gunShortRange.radius = 200
          this.paths.gunLongRange.radius = 600
          break
        case 'Div':
          this.paths.gunShortRange.radius = 200
          this.paths.gunLongRange.radius = 1200
          break
        case 'Bde':
        case 'Cav':
          this.paths.gunShortRange.radius = 200
          this.paths.gunLongRange.radius = 800
          break
        case 'Gun':
          switch (unit.guns) {
            case '12lb':
              this.paths.gunShortRange.radius = 600
              this.paths.gunLongRange.radius = 1800
              break
            case '6lb':
              this.paths.gunShortRange.radius = 400
              this.paths.gunLongRange.radius = 1200
              break
            case 'HW':
              this.paths.gunShortRange.radius = 200
              this.paths.gunLongRange.radius = 1600
              break
          }
          break
      }
    },
    click: function(marker) {     
      switch (marker.type) {
        case 'U':
          this.color = marker.color
          this._matchRangeMarker(marker)
          this.getParentDistance(marker)
          switch (marker.lvl) {
            case 'HQ':
              this.HQ[marker.color] = marker.id
              break
            case 'Corps':
              this.Corps[marker.color] = marker.id
              break
            case 'Gun':
              this.nextGun = marker.guns 
              break
            case 'Cav':
              this.nextCav = marker.cav
              break
          }
          break
        case 'O':
          switch (this.oMode) {
            case 'Del':
              this.deleteObj(marker)
              this.oMode = 'New'
              break
            case 'Connect':
              if (this.lastObj) {
                this.connectObj (marker, this.lastObj)
              }
              this.lastObj = marker
              break
          }
          break
      }
    },
    connectObj: function(oFrom,oTo) {
      var idFrom = oFrom.id
      var idTo = oTo.id
      if (idFrom == idTo) {
        return
      }

      // check to see if they are already connected
      var doit = true
      angular.forEach(oFrom.connections, function(conn, index) {
        if (conn == idTo) {
          doit = false
        }
      })

      if (doit) {
        oFrom.connections.push(idTo)
        oTo.connections.push(idFrom)
        this.generateObjPaths()
    //console.log('CC5')
        this.changed = true
      }
    },
    deleteUnit: function(unit) {

      //console.log('deleteUnit',unit)
      // cull the child objects first
      var self = this
      angular.forEach(this.markers, function(v,k) {
        if (v.parent === unit.id) {
          //console.log('recurse down to',v.id)
          self.deleteUnit(v)
        }
      })

      var _index = this.units[unit.color].indexOf(unit)
      if (_index < 0) {
        return
      }
      this.units[unit.color].splice(_index,1)
      delete this.markers[unit.id]

      // delete any paths that emit from this unit back to the parent
      var _l = this.paths[unit.color].latlngs
      for (var i=0; i < _l.length; i++) {
        if (_l[i][0] == unit) {
          _l.splice(i,1)
          i--
        }
      }
    //console.log('CC6')
      this.changed = true

      this._hideRangeMarker()
    },
    deleteObj: function(obj) {

      var _index = this.objs.indexOf(obj)
      if (_index < 0) {
        return
      }
      this.objs.splice(_index,1)
      delete this.markers['O'+obj.id]

      // delete any paths that reference this object
      var _l = this.paths.objPaths.latlngs
      for (var i=0; i < _l.length; i++) {
        if (_l[i][0] == obj || _l[i][1] == obj) {
          _l.splice(i,1)
          i-- // compensate for the array shrinking
        }
      }
    //console.log('CC7')
      this.changed = true
    },
    disconnectObjective: function(obj) {

      // Clear out all connections
      obj.connections = []

      // For all other objectives, remove any connections that reference this ID
      angular.forEach (this.objs, function(_obj, _index) {
        for (var i=0; i < _obj.connections.length; i++) {
          if (_obj.connections[i] == obj.id) {
            _obj.connections.splice(i,1)
            i--
          }
        }
      }, this)

      this.generateObjPaths()
    //console.log('CC8')
      this.changed = true

    },
    _findObjById: function(id) {
      var i 
      for (i = 0; i < this.objs.length; i++) {
        if (this.objs[i].id == id) {
          return i
        }
      }
      return -1
    },
    generateObjPaths: function() {
      var conns = []

      // Generate an array of connections in the form [from,to]
      angular.forEach(this.objs, function(obj, index) {

        // For each connection from this Objective, create a path
        angular.forEach(obj.connections, function(connection, index, array) {

          // Create a path between these 2 valid objective markers
          var i = this._findObjById(connection)
          conns.push ([obj,this.objs[i]])

        }, this)
      }, this)

      this.paths.objPaths.latlngs = conns
    },
    convertUnitToSave: function(unit) {

      var myUnit = {
        lat: unit.lat,
        lng: unit.lng,
        name: unit.label.message,
        lvl: unit.lvl,
        id: unit.id,
        parent: unit.parent,
        nation: unit.nation,
      }      
      switch (unit.lvl) {
        case 'HQ':
          break
        case 'Corps':
          myUnit.cmd = unit.cmd
          myUnit.skill = unit.skill
          myUnit.logistics = unit.logistics
          myUnit.initiative = unit.initiative
          myUnit.vigour = unit.vigour
          break
        case 'Div':
        case 'Bde':
          myUnit.cmd = unit.cmd
          myUnit.skill = unit.skill
          myUnit.vigour = unit.vigour
          myUnit.sub = unit.sub
          break
        case 'Gun':
          myUnit.cmd = unit.cmd
          myUnit.skill = unit.skill
          myUnit.logistics = unit.logistics
          myUnit.guns = unit.guns
          myUnit.sub = unit.sub
          break
        case 'Cav':
          myUnit.cmd = unit.cmd
          myUnit.skill = unit.skill
          myUnit.initiative = unit.initiative
          myUnit.cav = unit.cav
          myUnit.sub = unit.sub
          break
      }

      return myUnit
    },
    convertUnitFromSave: function(color,data) {

      var _layer = 'tactical'
      switch (data.lvl) {
        case 'HQ':
        case 'Corps':
          _layer = 'strategic'
          break
      }

      var unit = {
        type: 'U',
        lvl: data.lvl,
        color: color,
        lat: data.lat,
        lng: data.lng,
        id: data.id,
        nation: data.nation,
        parent: data.parent,
        icon: $icons[color][data.lvl],
        focus: false,
        draggable: true,
        layer: _layer,
        label: {
          message: data.name,
          options: {
            noHide: true,
            offset: [2,2],
            opacity: 0.9,
          }
        },
      }

      this.getParentDistance(unit)
      switch (unit.lvl) {
        case 'HQ':
          break
        case 'Corps':
          unit.cmd = data.cmd
          unit.skill = data.skill
          unit.logistics = data.logistics
          unit.initiative = data.initiative
          unit.vigour = data.vigour
          break
        case 'Div':
        case 'Bde':
          unit.cmd = data.cmd
          unit.skill = data.skill
          unit.vigour = data.vigour
          unit.sub = data.sub
          break
        case 'Gun':
          unit.cmd = data.cmd
          unit.skill = data.skill
          unit.logistics = data.logistics
          unit.guns = data.guns
          unit.sub = data.sub
          break
        case 'Cav':
          unit.cmd = data.cmd
          unit.skill = data.skill
          unit.initiative = data.initiative
          unit.cav = data.cav
          unit.sub = data.sub
          break
      }
      return unit
    },
    convertObjToSave: function(obj) {
      return {
        id: obj.id,
        lat: obj.lat,
        lng: obj.lng,
        name: obj.name,
        color: obj.color,
        connect: obj.connections,
      }
    },
    convertObjFromSave: function(obj) {
      return {
        type: 'O',
        icon: $icons[obj.color],
        id: obj.id,
        lat: obj.lat,
        lng: obj.lng,
        name: obj.name,
        color: obj.color,
        connections: obj.connect,
        focus: false,
        draggable: true,
        opacity: 0.6,
        layer: 'objective',       
      }
    },
    deleteSlot: function(slot) {
      var myDeleteRequest = {
        token: $token.get(),
        'Slot': slot,
      }
      var deferred = $q.defer()

      $http.post(ENV.SERVER+'/deletemap', myDeleteRequest)
        .success(function(data,status) {
          $log.info('Delete Slot',data,status)
          $slots.load()
          deferred.resolve(status)
        }).error(function(data,status) {
          $log.info('Delete Slot Error',data,status)
          deferred.reject(status)
        })
    //console.log('CC9')
      this.changed = true
      return deferred.promise
    },
    save: function(slot, mapSaveReq) {
      var allUnits = {}
      var allObjs = []

      // Convert units
      angular.forEach (this.units, function(army,index) {       
        if (army.length > 0) {
          allUnits[index] = []
          angular.forEach (army, function(unit,i) {
            allUnits[index].push(this.convertUnitToSave(unit))
          }, this)
        }

      }, this)

      // Convert Objectives
      angular.forEach(this.objs, function(obj,index){
        var converted = this.convertObjToSave(obj)
        allObjs.push(converted)
      }, this)

      var myMap = {
        token: $token.get(),
        'Slot': slot,
        'Name': this.file.name,
        'Season': this.file.season,
        'Year': this.file.year,
        'Period': this.file.period,
        'Image': this.file.image,
        'Lat': mapSaveReq.center.lat,
        'Lng': mapSaveReq.center.lng,
        'Zoom': mapSaveReq.center.zoom,
        'Units': allUnits,
        'Obj': allObjs,
        'NextUnitId': this.nextUnitId,
        'NextObjId': this.nextObjId,
      }
      var deferred = $q.defer()

      $http.post(ENV.SERVER+'/savemap', myMap)
        .success(function(data,status) {
          //$log.info('Map Save",data,status)
          deferred.resolve(status)
        }).error(function(data,status) {
          $log.info('Map Save Error',data,status)
          deferred.reject(status)
        })
      this.changed = false
      return deferred.promise
    },
    saveToLocalStorage: function(mapSaveReq) {
      var allUnits = {}
      var allObjs = []
      //console.log('savetolocal',mapSaveReq)

      // Convert units
      angular.forEach (this.units, function(army,index) {       
        if (army.length > 0) {
          allUnits[index] = []
          angular.forEach (army, function(unit,i) {
            allUnits[index].push(this.convertUnitToSave(unit))
          }, this)
        }
      }, this)

      // Convert Objectives
      angular.forEach(this.objs, function(obj,index){
        var converted = this.convertObjToSave(obj)
        allObjs.push(converted)
      }, this)

      var myMap = {
        'Name': mapSaveReq.file.name,
        'Season': this.file.season,
        'Year': this.file.year,
        'Period': this.file.period,
        'Image': this.file.image,
        'Lat': mapSaveReq.center.lat,
        'Lng': mapSaveReq.center.lng,
        'Zoom': mapSaveReq.center.zoom,
        'Units': allUnits,
        'Obj': allObjs,
        'NextUnitId': this.nextUnitId,
        'NextObjId': this.nextObjId,
      }

      $localStorage.scenario = myMap
    },
    load: function(slot) {
      var deferred = $q.defer()
      var self = this

      $http.post(ENV.SERVER+'/loadmap',{
        token: $token.get(),
        slot: slot,
      }).success(function(data,status) {

        self.file.name = data.Name
        self.file.season = data.Season
        self.file.year = data.Year
        self.file.image = data.Image
        self.file.period = data.Period

        self.unwind(data)
        data.markers = self.markers
        data.paths = self.paths

        deferred.resolve(data)
      }).error(function(data,status) {
        $log.warn(data,status)
        deferred.reject(status)
      })
      this.changed = false
      return deferred.promise
    },
    loadFromLocalStorage: function() {
      var data = $localStorage.scenario     
      if (angular.isDefined(data)) {
        this.file.name = data.Name
        this.file.season = data.Season
        this.file.year = data.Year
        this.file.period = data.Period
        this.image = data.Image

        this.unwind(data)
        data.markers = this.markers
        data.paths = this.paths
      }
      this.changed = false
      return data
    },
    unwind: function(data) {
      // Unwind the data into our structure now
      // And return a new set of markers and paths to apply

//      console.log('unwinding',data)
      // Zap everything
      this.newScenario()

      // zap the units
      angular.forEach($armies, function(army) {

        // populate the unit array for this color from the data
        angular.forEach (data.Units[army.name], function(unit,i) {
          var newUnit = this.convertUnitFromSave(army.name, unit)

          // Add to the units array
          this.units[army.name].push (newUnit)

          // push into the markers array as well
          this.markers[newUnit.id] = newUnit

          // And update the paths, if this new unit has a parent
          if (newUnit.parent) {
            var newPath = [ this.markers[newUnit.id], this.markers[newUnit.parent] ]
            this.paths[army.name].latlngs.push(newPath)
          }

        }, this)

      }, this)

      // Now extract the objectives !
      angular.forEach (data.Obj, function(obj,i) {
        var newObj = this.convertObjFromSave(obj)
        this.objs.push(newObj)

        // Add the marker
        this.markers['O'+obj.id] = newObj
      }, this)

      this.generateObjPaths()      
      this.nextObjId = data.NextObjId
      this.nextUnitId = data.NextUnitId

      this.changed = false
    },
    getMarkers: function() {
      var m = []

      angular.forEach(this.blue, function(unit,index) {
        m.push(unit.marker)
      })
      angular.forEach(this.red, function(unit,index) {
        m.push(unit.marker)
      })
      return m
    },
    getParentDistance: function(unit) {
      if (unit && unit.parent) {
        var _p = this.markers[unit.parent]
        var here = L.latLng({lat: unit.lat, lng: unit.lng})
        var there = L.latLng({lat: _p.lat, lng: _p.lng})
        var metres = here.distanceTo(there)
        var _km = Math.round(metres / 1000)

        unit.parentMetres = metres
        unit.parentDistance = _km

        if (_km < 2) {
          unit.parentDistance = ''+(100*Math.round(metres / 75))+' paces from HQ'
        } else if (_km < 5) {
          unit.parentDistance = 'within a league of HQ'
        } else if (_km < 9) {
          unit.parentDistance = 'a couple of leagues from HQ'
        } else if (_km < 19) {
          unit.parentDistance = 'some '+Math.round((metres+2500) / 4800)+' leagues from HQ'        
        } else {
          unit.parentDistance = 'about '+Math.round((_km + 12) / 25)+' days march from HQ'
        }

        var _c = Math.round((_km+0.3)/12)
        if (_c < 1.5) {
          unit.courierTime = 'within the hour by horse'
        } else if (_km < 25) {
          unit.courierTime = 'up to '+_c+' hrs by horse'       
        } else {
          // Over 25km, travel at a reduced speed
          _c = Math.round(_km / 6)
          unit.courierTime = 'up to '+_c+' hrs by horse'       
        }
        if (_km < 2) {
          unit.courierTime = 'within half an hour by horse'
        } 
        if (metres < 500) {
          unit.courierTime = 'within direct contact'
        }
      }
    },

  }
}])

//=============================================================================================================================
// $layers
//
// Simple JS object that contains the layers needed in the mapping controls. Saves defining these all over the code - keep em
// once in a single service, and use everywhere.

.factory('$layers', [function() {
  return {
    baselayers: {
      watercolor: {
          name: 'WaterColor',
          url: 'http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.png',
          type: 'xyz'
      },
      topographic: {
          name: 'TopoGraphic',
          url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          type: 'xyz'
      },
      technical: {
          name: 'Technical',
          url: 'http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png',
          type: 'xyz'
      },               
    },
    overlays: {
      hillshade: {
          name: 'Hillshade Europa',
          type: 'wms',
          url: 'http://129.206.228.72/cached/hillshade',
          visible: false,
          layerOptions: {
              layers: 'europe_wms:hs_srtm_europa',
              format: 'image/png',
              opacity: 0.25,
              attribution: 'Hillshade layer by GIScience http://www.osm-wms.de',
              crs: L.CRS.EPSG900913
          }
      },
      labels: {
        name: 'Labels',
        url: 'http://{s}.tile.stamen.com/toner-labels/{z}/{x}/{y}.png',
        type: 'xyz',
        visible: true
      }
    },
  }
}])

//=============================================================================================================================
// $tabs
//
// A fix for broken ionic tabs delegate

.factory('$tabs', ['$ionicTabsDelegate', function($ionicTabsDelegate) {
  return {
    get: function(handle) {

      var tabs = $ionicTabsDelegate._instances
      var theTab  

      angular.forEach(tabs, function(v,k){
        if (v.$$delegateHandle === handle) {
          theTab = v
        }
      })
      return theTab
    },
    select: function(handle,position) {
      // console.log('tabs select',handle,position)
      var theTab = this.get(handle)
      if (theTab !== undefined) {
        theTab.select(position)
      }
    }
  }
}])

//=============================================================================================================================
// $icons
//  init()
//
// Simple JS object that contains the icons for the objectives, and dynamically expands itself to include all the icons for the
// different colors (as defined in $armies array). Call init() once at the start of the run to expand out the $icons object
// and define all the icon picture files needed.


.factory('$icons', ['$armies', function($armies) {
  return {
    GoldObjective: {
      iconUrl: 'icons/goldObjective.png',
      iconSize: [64,64],
      iconAnchor: [32,32]
    },
    BlueObjective: {
      iconUrl: 'icons/blueObjective.png',
      iconSize: [80,80],
      iconAnchor: [40,40]
    },
    RedObjective : {
      iconUrl: 'icons/redObjective.png',
      iconSize: [96,91],
      iconAnchor: [48,46]
    },
    initialized: false,
    icons: {},
    // Dynamically expand this Javascript Object to include references
    // to every combination of army / color vs unit type !
    init: function() {

      if (this.initialized) {
        return
      }

      angular.forEach($armies, function(army) {

        this[army.name] = {}

        this[army.name].HQ = {
          iconUrl: 'icons/'+army.name+'HQ.png',
          shadowUrl: 'icons/shadow.png',
          iconSize: [64,64],
          shadowSize: [64,64],
          iconAnchor: [0,64],
          shadowAnchor: [0,60]
        }
        this[army.name].Corps = {
          iconUrl: 'icons/'+army.name+'Corps.png',
          shadowUrl: 'icons/shadow.png',
          iconSize: [64,64],
          shadowSize: [64,64],
          iconAnchor: [0,64],
          shadowAnchor: [0,60]
        }
        this[army.name].Div = {
          iconUrl: 'icons/'+army.name+'Div.png',
          shadowUrl: 'icons/shadow.png',
          iconSize: [48,48],
          shadowSize: [48,48],
          iconAnchor: [0,48],
          shadowAnchor: [0,44]
        }
        this[army.name].Bde = {
          iconUrl: 'icons/'+army.name+'Bde.png',
          shadowUrl: 'icons/shadow.png',
          iconSize: [32,32],
          shadowSize: [32,32],
          iconAnchor: [0,32],
          shadowAnchor: [0,30]
        }
        this[army.name].Gun = {
          iconUrl: 'icons/'+army.name+'Gun.png',
          shadowUrl: 'icons/shadow.png',
          iconSize: [32,32],
          shadowSize: [32,32],
          iconAnchor: [0,32],
          shadowAnchor: [0,30]
        }
        this[army.name].Cav = {
          iconUrl: 'icons/'+army.name+'Cav.png',
          shadowUrl: 'icons/shadow.png',
          iconSize: [32,32],
          shadowSize: [32,32],
          iconAnchor: [0,32],
          shadowAnchor: [0,30]
        }
      }, this)
    },
}}])
;
