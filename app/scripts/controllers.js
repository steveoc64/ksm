'use strict';

angular.module('KSMapper.controllers', ['ionic'])

//=============================================================================================================================
// LoginController:
//  logIn()
//  register()
//  forgotPassword()

.controller('LoginController', [
  '$scope',
  '$state',
  '$tabs',
  '$token',
  '$login',
  '$localStorage',
  function(
    $scope, 
    $state, 
    $tabs, 
    $token, 
    $login, 
    $localStorage
  ) {

  $localStorage.$default({
    user: {},
    token: ''
  })

  angular.extend ($scope, {
    failedPasswd: false,
    user: $localStorage.user,
    errorCondition: '',

    login: function() {
      $tabs.select('welcome',1)
    },
    splash: function() {
      $tabs.select('welcome',0)
    },
    account: function() {
      $tabs.select('welcome',2)
    },

  })

  // On load the application, check to see if we are already logged in .... if so, 
  // go straight to the map
  $token.check($localStorage.token).then(function(){
    $scope.errorCondition = ''
    $scope.failedPasswd = false
    //console.log('change state to main.games')
    $state.go('main.games')
  })

  // Send username and passwd to the back end, 
  // receive back a valid token, or fail
  $scope.logIn = function(user) {
      $scope.errorCondition = 'Logging in ....';
      $login.login(user.email, user.password).then(function(status) {
        $scope.errorCondition = ''
        $scope.failedPasswd = false
        $state.go('main.games')
      }, function(status){
        if (status == 404) {
          $scope.account()
          $tabs.select('welcome',2)
        } else {
          $scope.failedPasswd = true
        }
      })
  }

  $scope.register = function(user) {
      $login.register(user).then(function(data) {
          $scope.errorCondition = data + '... Please check your email to validate your account'
          $scope.login()
        }, function(data) {
          $scope.errorCondition = data
        })
  }

  $scope.forgotPassword = function(user) {
      $scope.failedPasswd = false
      $login.forgot(user.email).then(function(data) {
        $scope.errorCondition = data
      })
  }

}])

//=============================================================================================================================
// MapController:
//  
//  Used for controlling an entire map / scenario editor

.controller('MapController', [
  '$scope',
  '$state',
  'leafletData',
  'leafletEvents',
  '$localStorage',
  '$token',
  '$scenario',
  '$layers',
  '$icons',
  '$slots',
  '$armies',
  '$stateParams',
  '$battleScenes',
  '$tabs',
  '$ionicScrollDelegate',
  '$timeout',
  '$lookup',
  '$ionicModal',
  '$ionicActionSheet',
  '$ionicPopup',
  function(
    $scope, 
    $state, 
    leafletData, 
    leafletEvents, 
    $localStorage,
    $token, 
    $scenario, 
    $layers, 
    $icons, 
    $slots, 
    $armies,
    $stateParams,
    $battleScenes,
    $tabs,
    $ionicScrollDelegate,
    $timeout,
    $lookup,
    $ionicModal,
    $ionicActionSheet,
    $ionicPopup
  ){

  // first check to see that we are allowed into the map, before we go any further
  $token.check()
  $lookup.init()

  // on boot, get the map object and set some params ... and then jump into the correct tab
  leafletData.getMap().then(function(map) {
//    L.control.scale().addTo(map)
    map.options.maxZoom = 11
    map.options.minZoom = 7
    $scope.map = map
    if ($scope.scale === undefined) {
      $scope.scale = L.control.scale()
      $scope.scale.addTo(map)
    }
  });

  $scenario.initScenario()
  $timeout(function() {
    $tabs.select('map',2)
  }, 300)

  angular.extend($scope, {
    lookup: $lookup,
    isLoaded: false,
    mappingMode: true,
    armies: $armies,
    color: 'Blue',
    showImageSelect: false,
    showInfPanel: false,
    showCavPanel: false,
    showGunPanel: false,
    showCmdPanel: false,
    allowedUnitTypes: [],
    edittingSubunit: null,
    battleScenes: $battleScenes,
    icons: $icons,
    data: {
      showReorder: false,
      showDelete: false,
      showUnitHeader: false,
    },
    events: {
      map: {
        enable: ['click', 'drag', 'contextmenu', 'dblclick', 'load'],
        logic: 'emit'
      },
      marker: {
        enable: ['click', 'drag', 'contextmenu', 'dblclick'],
        logic: 'emit'
      },
      path: {
        enable: ['click'],
        logic: 'emit'
      }
    },     
    slots: $slots,
    file: $scenario.file,
    layers: {
      baselayers: {
        watercolor: $layers.baselayers.watercolor
      },
      overlays: {
        labels: $layers.overlays.labels,
        objective: {
          type: 'group',
          name: 'Objectives',
          visible: true,
          zIndex: 101,
        },
        strategic: {
          type: 'group',
          name: 'Strategic',
          visible: true,
          zIndex: 102,
        },
        tactical: {
          type: 'group',
          name: 'Tactical',
          visible: false,
          zIndex: 103,
        }
      }
    },
    defaults: {
        zoomControlPosition: 'topleft',
    },
    center: {
      stratCenter: {
        lat: 50.92,
        lng: 11.58,
        zoom: 8
      },
      tacCenter: {
        lat: 50.92,
        lng: 11.58,
        zoom: 8
      },
      mapCenter: {
        lat: 50.92,
        lng: 11.58,
        zoom: 8
      }
    },
    usingSlot: 0,
    zoomed: false,
    controlstate: 1,
    controlFocus: false,
    unit: null,
    subSelected: null,
    maxbounds: {},
    markers: $scenario.markers,
    paths: $scenario.paths,
    scenario: $scenario,
    showUnit: false,
    canReturn: false
  });

  // Initialise the slots - either from the database, or localstorage
  $slots.load()

  $scope.hasLocalStore = function() {
    //console.log($localStorage.scenario)
    return angular.isDefined($localStorage.scenario)
  }

  $scope.backBtn = function(a) {
    switch (a) {
      case 1:
        if ($scope.canReturn) {
          // Save before continuing

          switch ($stateParams.slot) {
            case 'new':
            case 'local':
              if (!angular.equals($scenario.markers, {})) {
                $scenario.saveToLocalStorage({
                  file: $scope.file,
                  center: $scope.center.stratCenter
                })
              }
              $state.go('main.scenarios',{page: 'scenarios'})
              break
            default:
              if ($scenario.changed) {
                $tabs.select('map',2)
                var slotIndex = -1
                angular.forEach($scope.slots.slots, function(v,k) {
                  if (v.Slot == $scope.usingSlot) {
                    slotIndex = k
                  }
                })
                $ionicActionSheet.show({
                  titleText: 'So you want to Quit ?',
                  buttons: [
                    {text: 'Save Changes and Exit'},
                  ],
                  destructiveText: 'Quit without Saving',
                  cancelText: 'Cancel - Stay in the Editor',
                  androidEnableCancelButton: true,
                  cancel: function() {

                  },
                  buttonClicked: function(index) {
                    $scope.commitSave($scope.usingSlot, $scope.file)
                    $state.go('main.scenarios',{page: 'scenarios'})
                  },
                  destructiveButtonClicked: function() {
                    $state.go('main.scenarios',{page: 'scenarios'})
                  }
                })
              } else {
//                console.log('No changes - no save')
                $state.go('main.scenarios',{page: 'scenarios'})
              }
              $slots.load()
              break
          }
        }
        break
      case 2:
        $scope.canReturn = true
        break
    }
  }

  $scope.saveMap = function() {
    if ($scope.usingSlot === 0) {
      // Get a new slot ID, being 1 more than the current maximum
      var maxId = 0
      angular.forEach($scope.slots.slots, function(v) {
        if (v.Slot > maxId) {
          maxId = v.Slot
        }
      })
      $scope.usingSlot = maxId + 1
    }
//    console.log('Saving changed scenario',$scope.usingSlot)
    $scope.commitSave($scope.usingSlot, $scope.file)
    $scenario.changed = false
    $scope.onEditMap()
    $tabs.select('map',2)
  }

  $scope.onEditMap = function() {
    $scope.mappingMode = true
    $scope.topLevelControls()
    $scope.isLoaded = true
    $scope.controlstate = 0
  }

  $scope.onRoster = function() {
    $scope.mappingMode = false
    $scope.isLoaded = false
    $scope.controlstate = 0
  }

  $scope.mainMenu = function() {
    $scope.isLoaded = false
    $state.go('main.scenarios')
  }

  $scope.getRatingDesc = function(rt) {
    if (typeof rt !== 'undefined') {
      return $lookup.rating[rt].name
    }
  }

  $scope.objectiveMenu = function() {
    $scope.mode = 'Objective'
    $scenario.objMode('New','GoldObjective')
    $scope.layers.overlays.objective.visible = true
    $scope.layers.overlays.strategic.visible = false
    $scope.layers.overlays.tactical.visible = false
    $scope.showUnit = false
  }
  $scope.objMode = function(x,color) {
    $scenario.objMode(x,color)
  }
  $scope.unitControls = function(Color) {
    $scope.mode = 'Subunits'
    $scope.level = 'HQ'
    $scope.color = Color
    $scenario.setSelection(Color,'HQ')
    $scope.layers.overlays.objective.visible = false
    $scope.layers.overlays.strategic.visible = true
    $scope.layers.overlays.tactical.visible = $scope.zoomed

  }
  $scope.topLevelControls = function() {
    $scope.mode = 'Move'
    $scenario.clearSelection()   
    $scope.closeUnitPopup()
    $scope.closeObjectivePopup()    
    $scope.layers.overlays.objective.visible = false
    $scope.layers.overlays.strategic.visible = true
    $scope.layers.overlays.tactical.visible = $scope.zoomed
  }
  $scope.popupUnit = function(theMarker) {
    $scope.unit = theMarker
    $scope.color = theMarker.color
    $scope.showUnit = true
    $scope.showObjectiveDetails = false
    $scope.layers.overlays.objective.visible = false
    $scope.layers.overlays.strategic.visible = true
    $scope.layers.overlays.tactical.visible = $scope.zoomed
    $scenario.getParentDistance($scope.unit)
    $scope.controlstate = 0
    $scope.mode = 'Subunits'
  }
  $scope.popupObjective = function(theMarker) {
    $scope.objective = theMarker
    $scope.showObjectiveDetails = true
    $scope.showUnit = false
    $scope.layers.overlays.objective.visible = true
    $scope.layers.overlays.strategic.visible = false
    $scope.layers.overlays.tactical.visible = false
    $scope.controlstate = 0
  }
  $scope.closeUnitPopup = function() {
    $scope.showUnit = false
  }
  $scope.closeObjectivePopup = function() {
    $scope.showObjectiveDetails = false
  }

  $scope.showObjectives = function() {
    return $scope.mappingMode && $scope.mode == 'Objective'
  }
  $scope.showSubunits = function() {
    return $scope.mappingMode && $scope.mode == 'Subunits'
  }
  $scope.showToplevelControls = function() {
    switch ($scope.mode) {
      case 'Subunits':
      case 'Objective':
        return false;
    }
    return $scope.mappingMode;
  }
  $scope.showMapControls = function() {
    return $scope.controlstate > 0
  }

  $scope.showFileControls = function() {
    return $scope.controlstate == 1
  } 
  $scope.showSlotControls = function() {
    return $scope.controlstate > 1
  }
  $scope.showLoadControls = function() {
    return $scope.controlstate == 2
  }
  $scope.showSaveControls = function() {
    return $scope.controlstate == 3
  }


  $scope.controlsCloseMainMenu = function() {
    $scope.controlstate = 0
  }
  $scope.controlsMainMenu = function() {
    $scope.controlstate = 1
    $scope.closeObjectivePopup()
    $scope.closeUnitPopup()
  }
  $scope.controlsLoadMenu = function() {
    $slots.load()
    $scope.controlstate = 2
  }
  $scope.controlsSaveMenu = function() {
    $slots.load()
    $scope.controlstate = 3
  }

  $scope.selectUnit = function(lvl) {    
    $scope.level = lvl
    $scenario.setSelection($scope.color,lvl)
  }

  $scope.clickControls = function() {
    $scope.controlFocus = true
  }

  $scope.duplicate = function() {
    $scope.file.name = 'copy of '+$scope.file.name
    $scope.usingSlot = 0
  }

  // Events for the map itself
  // Click : Add a new unit at this location
  // ContextMenu :  Toggle Zoom Level
  // DoubleClick : Center on this point
  // DragEnd / ZoomEnd :  Clear the adding unit mode

  $scope.$on('leafletDirectiveMap.load', function(event, args) {
    $timeout(function() {
      $scope.isLoaded = true      
    }, 100)
  })

  $scope.$on('leafletDirectiveMap.drag', function(event, args) {
    $scenario.changed = true
  })
  $scope.$on('leafletDirectiveMap.zoomlevelschange', function(event, args) {
    //$scenario.changed = true
  })

  $scope.$on('leafletDirectiveMap.contextmenu', function(event, args) {
    // Allow escape from zoom mode only from rightlick on map background
    if ($scope.zoomed) {
      $scope.toggleZoom(event, args)
    }
  })

  $scope.$on('leafletDirectiveMarker.dragstart', function(event,args) {
    $scope._dragStart = args.leafletEvent.target._latlng
    $scope._dragFrom = $scope._dragStart
    $scope.markerClick(event,args)  
  })

  $scope.$on('leafletDirectiveMarker.drag', function(event,args) {
    var _marker = $scope.markers[args.markerName]
    if (_marker.type == 'U') {
      $scenario.dragUnit(_marker,args.leafletEvent.target._latlng)

      if (!$scope.zoomed && _marker.lvl == 'Corps') {
        // Dragging a Corps in strategic mode - then drag all tactical subunits 
        // that are off map
        var _dragEnd = args.leafletEvent.target._latlng
        var _dlat = _dragEnd.lat - $scope._dragFrom.lat
        var _dlng = _dragEnd.lng - $scope._dragFrom.lng
        $scope._dragFrom = _dragEnd
        angular.forEach ($scope.markers, function(v,k) {
          if (v.parent == _marker.id) {
            v.lat += _dlat
            v.lng += _dlng
          }
        })       
      }
    }
    if (_marker.type == 'O') {
      $scenario.dragObjective(_marker,args.leafletEvent.target._latlng)
    }
    $scenario.changed = true
  })

  $scope.$on('leafletDirectiveMarker.dragend', function(event,args) {
    var _marker = $scope.markers[args.markerName]
    $scope._dragEnd = args.leafletEvent.target._latlng
    $scope.markerClick(event,args)  
  })

  $scope.$on('leafletDirectivePath.click', function(event,args) {
    // Now have to find which path was clicked on
    var thePath = $scope.findObjPath(args.leafletEvent.latlng)
    if (thePath !== undefined) {
      console.log('clicked on',thePath)

      var actions = $ionicActionSheet.show({
        buttons: [
          {text: 'Share'},
          {text: 'Move'}
        ],
        destructiveText: 'Delete Connection',
        titleText: 'Objective Connection',
        cancelText: 'Cancel',
        androidEnableCancelButton: true,
        cancel: function() {
          console.log('clicked on the cancel option')
        },
        buttonClicked: function(index) {
          return true
        },
        destructiveButtonClicked: function(index) {
          return true
        }
      })
    }
  })

  $scope.findObjPath = function(point) {
    console.log('Finding ObjPath closest to', point)
    var clickPoint = L.latLng(point)
    var retval
    console.log($scope.paths.objPaths)
    angular.forEach ($scope.paths.objPaths.latlngs, function(v,k){
      console.log(k,v)
      var p1 = L.latLng(v[0]),
          p2 = L.latLng(v[1])

      var hypotenuse = p1.distanceTo(p2),
          delta = p1.distanceTo(clickPoint) + clickPoint.distanceTo(p2) - hypotenuse

      if (delta < 10 && (delta / hypotenuse < 0.2)) {
        console.log('Looks like',v[0].name,' - ',v[1].name,' is the correct line',delta,v)
        retval = v
      } else {
        console.log('It aint',v[0].name,' - ',v[1].name,delta)
      }
    })
    return retval
  }

  $scope.getToggleDesc = function(unit) {
    if (unit) {
      if ($scope.zoomed) {
        switch(unit.lvl) {
          case 'HQ':
            return 'HQ Strategic View'
          default:
            return 'Corps Strategic View'
        }
      }
      return unit.lvl+' Tactical View'
    } 
  }

  $scope.getToggleIcon = function() {
    if ($scope.zoomed) {
      return 'ion-ios-undo'
    }
    return 'ion-ios-search'

  }

  $scope.toggleUnitZoom = function(unit) {
    if ($scope.zoomed) {
      switch (unit.lvl) {
        case 'HQ':
        case 'Corps':
          break
        default:
          // select the parent unit before toggling back
//          console.log('need to select my parent',unit.parent)
          var _p = $scope.markers[unit.parent]
//          console.log(_p)
          $scope.markerClick(null,{
            markerName: unit.parent,
            leafletEvent: {
              latlng: {lat: _p.lat, lng: _p.lng}
            }
          })
          break
      }
    } else {
      // Have to center the unit before zooming !!!
//      console.log('Zooming on unit',unit)      
      $scope.center.mapCenter.lat = unit.lat
      $scope.center.mapCenter.lng = unit.lng
    }
    $scope.toggleZoom()
  }

  $scope.toggleZoom = function(event,args) {

    if ($scope.zoomed) {
      //console.log('Unzoom back to',$scope.scenter)
      delete $scope.layers.baselayers.topographic
      $scope.layers.baselayers.watercolor = $layers.baselayers.watercolor
      $scope.layers.overlays.labels.visible = true
      //$scope.layers.overlays.objective.visible = true
      //$scope.layers.overlays.strategic.visible = true
      $scope.layers.overlays.tactical.visible = false
      $scope.map.options.maxZoom = 12
      $scope.map.options.minZoom = 7
      angular.copy($scope.center.stratCenter, $scope.center.mapCenter)
      $scope.zoomed = false
      $scope.maxbounds = {}
      $scenario.setSelection($scope.color,'Corps')
    } else {
      //console.log('Zoom to',lat,lng,' x12')

      var lat = 0.0
      var lng = 0.0

      if (args) {
        lat = args.leafletEvent.latlng.lat
        lng = args.leafletEvent.latlng.lng
      } else {
        lat = $scope.center.mapCenter.lat
        lng = $scope.center.mapCenter.lng
      }

      $scope.map.options.maxZoom = 15
      $scope.map.options.minZoom = 13       
      // Save the current view into the scenter
      angular.copy($scope.center.mapCenter,$scope.center.stratCenter)
      $scope.center.mapCenter.lat = lat
      $scope.center.mapCenter.lng = lng
      $scope.center.mapCenter.zoom = 12

      delete $scope.layers.baselayers.watercolor
      $scope.layers.overlays.labels.visible = false
      //$scope.layers.overlays.objective.visible = true
      //$scope.layers.overlays.strategic.visible = true
      $scope.layers.overlays.tactical.visible = true
      $scope.layers.baselayers.topographic = $layers.baselayers.topographic
      $scope.zoomed = true
      $scenario.setSelection($scope.color,'Div')    

      // set a bounds for this tactical view
      $scope.maxbounds = {
        northEast: {
          lat: lat + 0.1,
          lng: lng + 0.1, 
        },
        southWest: {
          lat: lat - 0.1,
          lng: lng - 0.1, 
        }
      }
    }
  }

  $scope.$on('leafletDirectiveMap.zoomend', function() {
    //$scenario.clearSelection()    
  })

  $scope.$on('leafletDirectiveMap.dblclick', function(event, args) {
    var lat = args.leafletEvent.latlng.lat
    var lng = args.leafletEvent.latlng.lng

    $scope.center.mapCenter.lat = lat
    $scope.center.mapCenter.lng = lng
    $scope.center.mapCenter.zoom++
    if ($scope.center.mapCenter.zoom > $scope.map.options.maxZoom) {
      $scope.center.mapCenter.zoom = $scope.map.options.maxZoom
    }

  })

  $scope.closeHQModal = function(nation) {
//    console.log('Assign nation',nation)
    $scope.addedHQ.nation = nation
    $scope.newHQmodal.hide()
    $scope.popupUnit($scope.addedHQ)
  }


  $scope.$on('leafletDirectiveMap.click', function(event, args) {
    var lat = args.leafletEvent.latlng.lat
    var lng = args.leafletEvent.latlng.lng

    if ($scope.mode == 'Objective') {
      switch ($scenario.oMode) {
        case 'New':
          $scope.popupObjective($scenario.addObjective($scenario.oColor,lat,lng))
          break
        // Other ObjModes only apply to clicking on the marker itself
      }
    } else {
      if ($scenario.level == 'HQ') {
        $scope.newLat = lat
        $scope.newLng = lng
        $scope.addedHQ = $scenario.addUnit($scenario.color,$scenario.level,$scope.newLat,$scope.newLng)

        // Define a handler for the modal dialog to define a new scenario
        $ionicModal.fromTemplateUrl('templates/new-hq.html', {
          scope: $scope,
          animation: 'fade-in'
        }).then(function (modal) {
          $scope.newHQmodal = modal
          modal.show()
        })
      } else {
        $scope.popupUnit($scenario.addUnit($scenario.color,$scenario.level,lat,lng))
      }
    }
  })


  // Events on markers :
  // Click :  set selected
  // RClick : zoom centered on this unit
  // Dragend : has moved
  $scope.$on('leafletDirectiveMarker.click', function(event, args) {
    $scope.markerClick(event,args)
  })

  // Toggle zoom, and then do exactly the same as a click
  $scope.$on('leafletDirectiveMarker.contextmenu', function(event, args) {
    $scope.toggleZoom(event, args)
    $scope.markerClick(event,args)
  })
  $scope.$on('leafletDirectiveMarker.dblclick', function(event, args) {
    $scope.toggleZoom(event, args)
    $scope.markerClick(event,args)
  })

  $scope.markerClick = function(event,args) {
    var theMarker = $scope.markers[args.markerName]    

    if (theMarker) {
      switch (theMarker.color) {
        case 'GoldObjective':
        case 'BlueObjective':
        case 'RedObjective':
          if ($scenario.oMode != 'Connect') {
            $scope.popupObjective(theMarker)
          }
          $scenario.click(theMarker)
          break
        default: // Assume its a unit then, where color = name of the army
          // Center the map on the unit - needed for zooming and things
          if (args.leafletEvent.latlng !== undefined) {
            var lat = args.leafletEvent.latlng.lat
            var lng = args.leafletEvent.latlng.lng

            $scope.center.mapCenter.lat = lat
            $scope.center.mapCenter.lng = lng
          }

          $scenario.click(theMarker)
          $scope.popupUnit(theMarker)
          break
      }
    }

  }

  $scope.changeFlag = function(unit) {
//    console.log('Change Flag', unit)
    //$scope.data.showUnitHeader = !$scope.data.showUnitHeader
  }

  $scope.barClass = function() {
    var _a = $scenario.getArmy()
    if (_a) {
      return 'bar bar-'+_a.class
    } else {
      return 'bar bar-positive'
    } 
  }

  $scope.saveToSlot = function(slot) {
      // Validate the slot number
      if (slot < 1 || slot > $scope.slots.length) {
        console.log('Invalid slot number', slot)
        return 
      }

      // Check that all the fields are filled in
      if (!$scope.file.name || !$scope.file.season || !$scope.file.year || !$scope.file.period) {
        //console.log($scope.file.name,$scope.file.season,$scope.file.year,$scope.file.period)
        $ionicPopup.alert({
          title: 'Please fill in the details of your scenario, including :<ul><li>Name<li>Year<li>Season</ul>',
        })
      } else {
        // If the slot is NOT empty, then confirm overwrite
        switch ($scope.slots[slot-1].Type) {
          case '': // Empty slot
            $scope.commitSave(slot, $scope.file)
            break
          default:
            $ionicPopup.confirm({
              title: 'Overwrite Slot',
              subTitle: $scope.slots[slot-1].Type,
              template: $scope.slots[slot-1].Name,
            }).then(function(doIt) {
              if (doIt) {
                $scope.commitSave(slot, $scope.file)
              }
            })
            break
        }
      }
  }

  $scope.commitSave = function(slot, file) {
      //$scope.controlsMainMenu()    
      //console.log('commitSave',slot,file)

      // Save the center location for the strategic view only
      var cen = $scope.center.mapCenter
      if ($scope.zoomed) {
        cen = $scope.center.stratCenter
      }

      $scenario.save(slot, {
        file: file,
        center: cen}).then(function() {
          $slots.load()
        })
      if ($scope.usingSlot) {
        /* $ionicPopup.alert({
          title: 'Changes to map have been saved',
        }) */           
      }
      $scope.usingSlot = slot
  }

  $scope.loadFromSlot = function(slot) {

      $scenario.load(slot).then(function(data) {
        //console.log('loaded from slot', data)
        $lookup.getForces(data.Period)
        if ($scope.zoomed) {
          $scope.toggleZoom()
        }
        $scope.layers.overlays.objective.visible = true
        $scope.layers.overlays.strategic.visible = true
        $scope.layers.overlays.tactical.visible = false
        $scope.layers.overlays.labels.visible = true
        $scope.center.mapCenter.lat = data.Lat
        $scope.center.mapCenter.lng = data.Lng
        $scope.center.mapCenter.zoom = data.Zoom

        $scope.markers = data.markers
        $scope.paths = data.paths

        $scope.usingSlot = slot
        $scenario.changed = false

        $scope.topLevelControls()
      })
  }

  $scope.colorChange = function(obj) {
    obj.icon = $icons[obj.color]
  }

  $scope.gunChange = function(unit) {
    $scenario._matchRangeMarker(unit)
    $scenario.nextGun = unit.guns
  }

  $scope.selectCav = function(unit) {
    $scenario.nextCav = unit.cav
  }

  $scope.deleteObjective = function(obj) {

    $ionicPopup.confirm({
      title: 'Delete This Objective ?',
      subTitle: obj.name,
    }).then(function(doIt) {
      if (doIt) {
        $scenario.deleteObj(obj)
      }
    })
  }

  $scope.quitEditor = function(delSlot) {
    if ($scope.usingSlot) {
      $ionicPopup.confirm({
        title: 'Delete This Scenario ?',
      }).then(function(doIt) {
        if (doIt) {
          //console.log('Deleting slot', $scope.usingSlot)
          $scenario.deleteSlot($scope.usingSlot)
          // Now quit back to the scenario list, without saving
          $state.go('main.scenarios',{page: 'scenarios'})      
        }
      })
    } else {
      // Now quit back to the scenario list, without saving
      $state.go('main.scenarios',{page: 'scenarios'})      
    }
  }

  $scope.disconnectObjective = function(obj) {
    $ionicPopup.confirm({
      title: 'Disconnect this Objective ?',
      subTitle: obj.name,
    }).then(function(doIt) {
      if (doIt) {
        $scenario.disconnectObjective(obj)
      }
    })
  }

  $scope.deleteUnit = function(unit) {
    $ionicPopup.confirm({
      title: 'Delete this Unit ?',
      subTitle: unit.label.message,
    }).then(function(doIt) {
      if (doIt) {
        $scenario.deleteUnit(unit)
        $scope.closeUnitPopup()

        // If we just deleted a Corps or HQ, then jump back to strat mode
        if ($scope.zoomed) {
          switch(unit.lvl) {
            case 'HQ':
            case 'Corps':
              $scope.toggleZoom()
              break
          }
        }
      }
    })   
  }
 
  $scope.selectImage = function() {
    $scope.showImageSelect = !$scope.showImageSelect
  }


  $scope.closeSelectImage = function() {
    $scope.showImageSelect = false
  }

  $scope.imageSelected = function(index) {
    //console.log('imageSelected',index)
    $scope.file.image = $battleScenes[index]
    $scope.showImageSelect = false
    $scenario.changed = true
  }

  $scope.getHQList = function(color) {

    var HQ = []
    angular.forEach($scenario.units[color], function(unit) {
      if (unit.lvl == 'HQ' && unit.color == color) {
        HQ.push(unit)
      }
    })

    return HQ
  }

  $scope.getCorpsList = function(color,parentid) {
    var Corps = []
    angular.forEach ($scenario.units[color], function(unit) {
      if (unit.lvl == 'Corps' && unit.parent == parentid) {
        Corps.push(unit)
      }
    })
    return Corps
  }

  $scope.getSubunitList = function(color,parentid) {
    var _u = []

    //console.log('getsubunits of',color,parentid)

    angular.forEach ($scenario.units[color], function(unit) {
      if (unit.parent == parentid) {
        _u.push(unit)
      }
    })
    return _u
  }

  $scope.roster = function(lvl,unit) {
    $scope.unit = unit
    //console.log('roster',lvl,unit)

    switch (lvl) {
      case 'HQ':
        $scenario.setSelection(unit.color,'HQ')
        $tabs.select('map',3)  // Main Unit roster screen
        break
      case 'Corps':
        $scenario.setSelection(unit.color,'Corps')
        $tabs.select('map',4)  // Corps details roster screen
        break
      default:
        $scenario.setSelection(unit.color,unit.lvl)
        $tabs.select('map',5)  // Div subunit details roster screen
        $timeout(function(){
          $ionicScrollDelegate.$getByHandle('subUnitScroll').scrollTop(true)
        },50)
        break
    }  
  }

  $scope.scrollSubsToTop = function() {
    $timeout(function(){
      $ionicScrollDelegate.$getByHandle('subUnitScroll').scrollTop(true)
    },50)    
  }

  $scope.addSubUnit = function(unit,type) {
    var s = {}

    switch(type) {
      case 'X':
        angular.extend(s,{
          Type: 'X',
          Name: 'Commander',
          Attr: 1
        })
        break
      case 'I':
        // Get the first allowed infantry type for this Period/Nation and copy that as the default
        var period = $scope.file.period
        var allowed = 0
        angular.forEach ($lookup.forces, function(f) {
          if (f.Period === period && f.Nation === unit.nation) {
            allowed = f.Inf[0]
          }
        })
        if (allowed) {
          var u = $lookup.inf[allowed]
          //console.log('Create inf of type',allowed,u)
          angular.extend(s,{
            Type: 'I',
            Name: 'Infantry Bn',
            Rating: 5,
            Size: 700,
            Attr: allowed
          })
        }
        break
      case 'C':
        angular.extend(s,{
          Type: 'C',
          Name: 'Cavalry',
          Rating: 6,
          Size: 400,
          Attr: 3
        })
        break
      case 'A':
        angular.extend(s,{
          Type: 'A',
          Name: 'Field Battery',
          Rating: 5,
          Size: 6,
          Attr: 2
        })
        break
    }
    //console.log(unit,type,s)
    unit.sub.push(s)
    $ionicScrollDelegate.$getByHandle('subUnitScroll').scrollTo(0,(unit.sub.length * 150)-300,true)
  }

  $scope.adjustUnitSize = function(unit, adjust, index) {
    $scope.subSelected = index
    switch(unit.Type) {
      case 'I':
      case 'C':
        unit.Size += 25*adjust
        break
      case 'A':
        unit.Size += adjust
        break
    }
  }
  $scope.adjustUnitRating = function(unit, adjust, index) {
    $scope.subSelected = index
    switch(unit.Type) {
      case 'I':
      case 'C':
      case 'A':
        unit.Rating += adjust
        break
    }
    if (unit.Rating < 1) {
      unit.Rating = 1
    }
    if (unit.Rating > 11) {
      unit.Rating = 11
    }
  }
  $scope.adjustUnitAttr = function(unit,subunit,index) {
    var period = $scope.file.period

    // If already open, close it
    if ($scope.showInfPanel) {
      $scope.showInfPanel = false
      return
    }
    if ($scope.showCavPanel) {
      $scope.showCavPanel = false
      return
    }
    if ($scope.showGunPanel) {
      $scope.showGunPanel = false
      return
    }
    if ($scope.showCmdPanel) {
      $scope.showCmdPanel = false
      return
    }

    $scope.edittingSubunit = subunit   
    $scope.showInfPanel = false    
    $scope.showCavPanel = false    
    $scope.showGunPanel = false    
    $scope.showCmdPanel = false    
    $scope.subSelected = index
    switch (subunit.Type) {
      case 'X':
        $scope.showCmdPanel = true    
        break
      case 'I':
        angular.forEach ($lookup.forces, function(f) {
          if (f.Period === period && f.Nation === unit.nation) {
            $scope.allowedUnitTypes = f.Inf
          }
        })
        $scope.showInfPanel = true    
        break
      case 'C':
        $scope.showCavPanel = true    
        break
      case 'A':
        $scope.showGunPanel = true    
        break
    }
  }

  $scope.closeUnitTypePanel = function() {
    $scope.showInfPanel = false    
    $scope.showCavPanel = false    
    $scope.showGunPanel = false    
    $scope.showCmdPanel = false    
  }

  $scope.getInfantryImage = function(infAttr) {
    return 'troops/'+$scope.lookup.inf[infAttr].image+'.jpg'
  }
  $scope.getInfantryBases = function(infAttr) {
    var retval = ''
    var d = $scope.lookup.inf[infAttr]
    retval = '' + d.bases[0] + 'x Bases'
    if (d.bases[2]) {
      retval += ' (incl '+d.bases[2]+' Elite)'
    }
    retval += ' in '+d.ranks+' ranks'
    if (d.bases[1] > 0) {
      if (d.bases[0] > 0) {
        retval += ' + '+d.bases[1]+' Sk'
      } else {
        retval = '1 Base -> '+d.bases[1]+' Skirmishers'
      }
    }
    return retval
  }
  $scope.unitAttrSelected = function(attr) {
    $scope.edittingSubunit.Attr = parseInt(attr)
    $scope.closeUnitTypePanel()
    $scope.edittingSubunit = null
  }

  $scope.infChooserClass = function(index) {
    if ($scope.edittingSubunit !== null) {
      //console.log('infChooserClass',index,$scope.allowedUnitTypes[index],$scope.edittingSubunit.Attr)
      if ($scope.allowedUnitTypes[index] === $scope.edittingSubunit.Attr) {
        return 'item-calm'
      }
    }
  }
  $scope.getChooserClass = function(key) {
    if ($scope.edittingSubunit !== null) {
      //console.log('getChooserClass',key,$scope.edittingSubunit.Attr)
      if (parseInt(key) === $scope.edittingSubunit.Attr) {
        return 'item-calm'
      }
    }
  }

  $scope.seasonImage = function(season) {
    return 'images/'+angular.lowercase(season)+'.jpg'
  }

  $scope.describeSubUnit = function(unit, details) {
    var r = $lookup.rating[unit.Rating]
    var _bases = 0
    switch(unit.Type) {
      case 'X':
        var c = $lookup.cmd[unit.Attr]
        if (details) {
          return c.name
        }
        return ''
      case 'I':
        var d = $lookup.inf[unit.Attr]
        var menPerBase = d.ranks * 75
        var halfBase = Math.round(menPerBase / 2)
        var _bonus = ''
        if (unit.Rating >= d.fire[0]) {
          _bonus = '+Musketry'
        }
        if (unit.Rating <= d.fire[1]) {
          _bonus = '-Musketry'
        }
        if (unit.Rating >= d.bayonet[0]) {
          _bonus += ' +Bayonet'
        }
        if (unit.Rating <= d.bayonet[1]) {
          _bonus += ' -Bayonet'
        }
        if (d.shock) {
          _bonus += ' ShockTroops'
        }
        if (_bonus !== '') {
          _bonus = ' [ '+_bonus+' ]'
        }
        if (!details) {
          return r.name + ' Infantry - '+d.name+_bonus
        } else {
          var _b = ''
          if (d.bases[0] > 0) {
            var maxBases = Math.round((unit.Size + halfBase)/ menPerBase)
            _bases = d.bases[0]
            if (_bases > maxBases) {
              _bases = maxBases
            }
            _b += _bases + 'x Line Bases'
          }
          if (d.bases[2] > 0) { // French system elite div
              _b += ', (incl '+d.bases[2]+'x Elite)'
          }
          if (d.bases[1] > 0) {   // Permanent Skirmisher
            var maxSk = Math.round(unit.Size / 75)
            _bases = d.bases[1]
            if (_bases > maxSk) {
              _bases = maxSk
            }
            if (d.bases[0] > 0) {
              _b += ' + '+_bases+' attached Sk'
            } else {
              var maxSK = Math.round(unit.Size / 75)
              var _sb = d.bases[1]
              if (_sb > maxSK) {
                _sb = maxSK
              }
              _b += '1 Base -> '+_sb+' Sk'
            }
            if (d.rifle) {
              _b += ' (rifles)'
            }
          }
          if (d.bases[3] > 0 && unit.Rating > 4) { // Third Rank skirmisher system
            _b += ' ... can use 3rd Rank as Skirmishers'
          }
          return '('+unit.Size+' men as '+d.desc+' in '+d.ranks+' ranks) - '+_b
        }
        break
      case 'C':
        if (!details) {
          _bases = Math.round((unit.Size + 37)/ 75)
          return r.name + ' Cavalry - ('+unit.Size+' horse) - '+_bases+' bases - '+$lookup.cav[unit.Attr].name
        }
        break
      case 'A':
        if (!details) {
          var _models = Math.round(unit.Size/ 2)
          return r.name + ' Artillery - ('+unit.Size+' guns) - '+_models+' Gun Models - '+$lookup.gun[unit.Attr].name+' '+$lookup.gun[unit.Attr].desc
        }
        break
      default:
        return 'Unknown '+unit.type
    }
    return ''
  }

  $scope.subUnitClass = function(unit,index) {
    var _r = ''
    if (index === $scope.subSelected) {
      _r = 'item-stable '

    }
    switch(unit.Type) {
      case 'X':
        return _r+'item-divider item-avatar'
      case 'I':
      case 'C':
      case 'A':
        return _r+'item-avatar'
      default:
        return ''
    }    
  }

  $scope.subUnitAvatar = function(unit) {
    switch(unit.Type) {
      case 'X':
        return 'images/avatar-general.jpg'
      case 'I':
        return 'images/avatar-infantry.jpg'
      case 'C':
        return 'images/avatar-cavalry.jpg'
      case 'A':
        return 'images/avatar-artillery.jpg'
      default:
        return ''
    }    
  }

  $scope.delSubUnit = function(unit,index) {
    //console.log('Delete subunit',unit,index)
    unit.sub.splice(index,1)
    $scope.subSelected = null
  }

  $scope.editSubUnit = function(subunit,index) {
    //console.log('Editting',subunit)
    $scope.subSelected = index
  }

  $scope.reorderUnit = function(unit,subunit,index,amount) {
    //console.log('reorderUnit',unit,subunit,index,amount)
    unit.sub.splice(index,1)
    unit.sub.splice(index+amount,0,subunit)
    $scope.subSelected = index+amount
    $ionicScrollDelegate.$getByHandle('subUnitScroll').scrollBy(0,(150 * amount)-150,true)
  }

  $scope.unitToNextBde = function(unit,subunit,index) {
    //console.log('unitToNextBde',unit,subunit,index)
    $scope.subSelected = index

    // Find the next commander from here
    for (var i = index; i < unit.sub.length; i++) {
      if (unit.sub[i].Type == 'X') {
        unit.sub.splice(index,1)  // Remove the subunit from the original location
        unit.sub.splice(i,0,subunit)
        $scope.subSelected = i
        $ionicScrollDelegate.$getByHandle('subUnitScroll').scrollTo(0,(i * 150)-150,true)
        //console.log('Set to new position',i)
        return
      }
    }
  }

  $scope.unitToPrevBde = function(unit,subunit,index) {
    //console.log('unitToPrevBde',unit,subunit,index)
    $scope.subSelected = index

    // Find the next commander from here
    for (var i = index; i > 0; i--) {
      if (unit.sub[i].Type == 'X') {
        // We have found our current Bde commander, so insert this unit immediately 
        // before him to assign this unit to the prev bde commander
        if (i === 0) {
          // There are no more Bde commanders above him, so ignore
          return
        }

        unit.sub.splice(index,1)  // Remove the subunit from the original location
        unit.sub.splice(i,0,subunit) // place this subunit immediately before the Bde commander
        $scope.subSelected = i
        $ionicScrollDelegate.$getByHandle('subUnitScroll').scrollTo(0,(i * 150)-150,true)
        //console.log('Set to new position',i)
        return
      }
    }
  }

  $scope.usingSlot = 0

  switch ($stateParams.slot) {
    case 'new':
      // If there is NO Period defined, then it means we have refreshed on a new at some point
      // So back it off back to the scenario list

      if ($scenario.file.period === undefined || $scenario.file.period === '') {
        $state.go('main.scenarios',{page: 'scenarios'})
      } else {
        // Get the file params for this one, set the default position from the period selected

        //console.log('lookup period', $scenario.file.period)
        var thePeriod = $lookup.getPeriod($scenario.file.period)
        $scope.center.mapCenter.lat = thePeriod.lat
        $scope.center.mapCenter.lng = thePeriod.lng
        $scope.center.mapCenter.zoom = 8
        $scope.layers.overlays.objective.visible = true
        $scope.layers.overlays.strategic.visible = true
        $scope.layers.overlays.tactical.visible = false
        $scope.layers.overlays.labels.visible = true              

        $scope.saveMap()
      }
      break

    case 'local':
      var data = $scenario.loadFromLocalStorage()
      if (data !== null) {
        $scope.center.mapCenter.lat = data.Lat
        $scope.center.mapCenter.lng = data.Lng
        $scope.center.mapCenter.zoom = data.Zoom

        $scope.markers = data.markers
        $scope.paths = data.paths      
      }
      break

    default:
      //console.log('init map controller with slot id', $stateParams.slot)
      $scope.usingSlot = parseInt($stateParams.slot)
      $scope.loadFromSlot($scope.usingSlot)      
      break
  }


}])

//=============================================================================================================================
// mainController:
//  
//  Controller for the main tabs 

.controller('mainController', [
  '$scope',
  '$token',
  '$login',
  function(
    $scope, 
    $token,
    $login
  ){

  $token.check()
  console.log($login)
  $scope.login = $login
}])

//=============================================================================================================================
// gamesController:
//  
//  Controller for the game lobby and game launcher screen

.controller('gamesController', [
  '$scope',
  '$token',  
  '$login',
  function(
    $scope,
    $token,
    $login
  ){

  $token.check()
  $login.ensureLoggedin()
  $scope.login = $login

}])

//=============================================================================================================================
// manualsController:
//  
//  Controller for the documentation screens

.controller('manualsController', [
  '$scope',
  '$token',  
  '$login',
  function(
    $scope,
    $token,
    $login
  ){

  $token.check()
  $login.ensureLoggedin()
  $scope.login = $login

}])

//=============================================================================================================================
// scenariosController:
//  
//  Controller for the scenario list, and launcher for scenario editor

.controller('scenariosController', [
  '$scope', 
  '$slots',
  '$state',
  '$token',
  '$tabs',
  '$timeout',
  '$localStorage',
  '$ionicModal',
  '$scenario',
  '$lookup',
  '$login',
  function(
    $scope, 
    $slots, 
    $state, 
    $token,
    $tabs,
    $timeout,
    $localStorage,
    $ionicModal,
    $scenario,
    $lookup,
    $login
  ){

  $token.check()
  $lookup.init()
  $login.ensureLoggedin()
  $scope.login = $login

  // Define a handler for the modal dialog to define a new scenario
  $ionicModal.fromTemplateUrl('templates/new-scenario.html', {
    scope: $scope,
    //animation: 'slide-in-up'
    animation: 'fade-in'
  }).then(function (modal) {
    $scope.modal = modal
  })

  angular.extend($scope, {
    lookup: $lookup,
    slots: $slots,
    errorMsg: '',
    seasons: [
      {name: 'Spring', selected: true, image: 'images/spring.jpg'},
      {name: 'Summer', selected: false, image: 'images/summer.jpg'},
      {name: 'Autumn', selected: false, image: 'images/autumn.jpg'},
      {name: 'Winter', selected: false, image: 'images/winter.jpg'},
    ],
    file: {
      name: '',
      season: '',
      year: '',
      image: '',
      period: '',
    },
    loadFromSlot: function(slot) {
      //console.log('selected slot', slot)
      $state.go('map', {slot: slot})
    },
    hasLocalStore: function() {
      return angular.isDefined($localStorage.scenario)
    },
    newMap: function() {
      $scope.modal.show()
    },
    continueMap: function() {
      $state.go('map', {slot: 'local'})
    },
    closeCreateModal: function() {
      this.errorMsg = ''
      // Validate the fields before closing
      var f = this.file
      if (f.name !== '' && f.season !== '' && f.year !== '' && f.period !== '') {
        $scope.modal.hide()
        $scenario.createScenario(this.file)
        $lookup.getForces(this.file.period)
        $state.go('map', {slot: 'new'})      
      } else {
        this.errorMsg = 'Please select a  Theatre / Period, and enter : Name, Year & Season'
      }
    },
  })

  // Cleanup modal when we are done
  $scope.$on('$destroy', function() {
    $scope.modal.remove()
  })

  // Load MAP slots from the backend
  $slots.load()

}])

//=============================================================================================================================
// settingsController:
//  
//  Controller for the account settings details

.controller('settingsController', [
  '$scope', 
  '$token',
  '$localStorage',
  '$ionicPopup',
  '$login',
  function(
    $scope, 
    $token,
    $localStorage,
    $ionicPopup,
    $login
  ){

  $token.check()

  angular.extend($scope, {
    login: $login,
    user: $localStorage.user,
    scenarios: [],
    slots: [],
    updateUser: function(user) {
      $login.update(user).then(function() {
        $ionicPopup.alert({
          title: 'Account Details Updated'
        })
      })
    }
  })

}])

//=============================================================================================================================
// syslogController:
//  
//  Controller for the System Log display

.controller('syslogController', [
  '$scope', 
  '$token',
  '$localStorage',
  '$ionicPopup',
  '$login',
  function(
    $scope, 
    $token,
    $localStorage,
    $ionicPopup,
    $login
  ){

  $token.check()
  $scope.login = $login
  $login.ensureLoggedin().then(function() {
    console.log('login has returned')
  })


  angular.extend($scope, {
  })

}])

//=============================================================================================================================
// logoutController:
//  
//  Enable the user to logout of the system

.controller('logoutController', [
  '$scope', 
  '$token',
  '$localStorage',
  '$state',
  '$ionicPopup',
  function(
    $scope, 
    $token,
    $localStorage,
    $state,
    $ionicPopup
  ){

  $token.check()

  angular.extend($scope, {
    logout: function() {
      delete $localStorage.token
      $ionicPopup.alert({
        title: 'You have now logged out !'
      }).then(function() {
        $state.go('login')
      })
    }
  })
}])
