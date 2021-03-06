angular.module('reg')
.controller('CheckinCtrl', [
  '$scope',
  '$stateParams',
  'UserService',
  function($scope, $stateParams, UserService){
    $('#reader').html5_qrcode(function(data){
          //Change the input fields value and send post request to the backend
          $('#qrInput').attr("value", data);
          $scope.filterUsers();
          UserService
            .QRcheckIn(data)
            .success(function(user){
              selectUser(user);
            })
            .error(function(res){
              if(res === "User not confirmed!"){
                sweetAlert("Hey!", "This user did not confirm they are coming!", "error");
              }
              /*else if(res === "User already checked in!"){
                sweetAlert("Again?", "User already checked in!", "error")
              }*/
              else if(res === "User is rejected!"){
                sweetAlert("Hey!", "This user is rejected!", "error");                
              }
              else{
                sweetAlert("Uh oh!", "User does not exist or isn't admitted!", "error");
              }
            });
        },
      function(error){
      }, function(videoError){
        //the video stream could be opened
      }
    );
    $scope.pages = [];
    $scope.users = [];
    $scope.sortDate = true;

    // Semantic-UI moves modal content into a dimmer at the top level.
    // While this is usually nice, it means that with our routing will generate
    // multiple modals if you change state. Kill the top level dimmer node on initial load
    // to prevent this.
    $('.ui.dimmer').remove();
    // Populate the size of the modal for when it appears, with an arbitrary user.
    $scope.selectedUser = {};
    $scope.selectedUser.sections = generateSections({status: '',
    confirmation: {
      dietaryRestrictions: []
    }, profile: {
      occupationalStatus: [],
      bestTools: [],
      previousJunction: []
    }, reimbursement: {
          dateOfBirth: [],
    }
    });

    function updatePage(data){
      $scope.users = data.users.filter(function(user){
        return user.status.admitted !== false;
      }).filter(function(user){
        return user.status.declined !== true;
      });
      $scope.currentPage = data.page;
      $scope.pageSize = data.size;

      var p = [];
      for (var i = 0; i < data.totalPages; i++){
        p.push(i);
      }
      $scope.pages = p;
    }
    $scope.filterUsers = function() {
      UserService
        .getPage($stateParams.page, $stateParams.size, $scope.filter, $scope.sortDate)
        .success(function(data){
          updatePage(data);
        });
    }

    $scope.toggleCheckIn = function($event, user, index) {
      $event.stopPropagation();

      if (!user.status.checkedIn){
        swal({
          title: "Whoa, wait a minute!",
          text: "You are about to check in " + user.profile.name + "!",
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes, check them in.",
          closeOnConfirm: false
          },
          function(){
            UserService
              .checkIn(user._id)
              .success(function(user){
                $scope.users[index] = user;
                swal("Check!", user.profile.name + ' has been checked in.', "success");
              });
          }
        );
      } 
      else {
        swal({
          title: "Whoa, wait a minute!",
          text: "You are about to check out " + user.profile.name + "!",
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: "Yes, check them out.",
          closeOnConfirm: false
          }, 
          function(){
            swal({
              title: "Are you ABSOLUTELY SURE?",
              text: "You are about to CHECK OUT " + user.profile.name + "!",
              type: "warning",
              showCancelButton: true,
              confirmButtonColor: "#DD6B55",
              confirmButtonText: "Yes, CHECK OUT.",
              closeOnConfirm: false
              }, function(){
              UserService
                .checkOut(user._id)
                .success(function(user){
                  $scope.users[index] = user;
                  swal("Checked out", user.profile.name + ' has been checked out.', "success");
            })
          });
      })}
    
    };

    function selectUser(user){
      $scope.selectedUser = user;
      $scope.selectedUser.sections = generateSections(user);
      $('.long.user.modal')
        .modal('show');
    }

    $scope.checkInUser = function($event, user, index) {
      $event.stopPropagation();


      swal({
        title: "Whoa, wait a minute!",
        text: "You are about to check in " + user.profile.name + "!",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, CHECK IN!",
        closeOnConfirm: false
        }, function(){


          UserService
            .checkIn(user._id)
            .success(function(user){
               swal("Checked in!", user.profile.name + ' has been checked in succesfully!.', "success");
            })
            .error(function(){
               swal("Something went wrong!", "error")
            });

        });

    };

    UserService
      .getPage($stateParams.page, $stateParams.size, $scope.filter, $scope.sortDate)
      .success(function(data){
        updatePage(data);
      });

      function formatTime(time){
        if (time) {
          return moment(time).format('MMMM Do YYYY, h:mm:ss a');
        }
      }

      function generateSections(user){
        return [
          {
            name: 'Basic Info',
            fields: [
              {
                name: 'Checked In',
                value: user.status.checkedIn,
                type: 'boolean'
              },{
                name: 'Name',
                value: user.profile.name
              },{
                name: 'Email',
                value: user.email
              },{
                name: 'ID',
                value: user.id
              },{
                name: 'Team',
                value: user.teamCode || 'None'
              }
            ]
          },{
            name: 'Profile',
            fields: [
              {
                name: 'Age',
                value: user.profile.age
              },{
                name: 'Travels from Country',
                value: user.profile.travelFromCountry
              },{
                name: 'Travels from City',
                value: user.profile.travelFromCity
              },{
                name: 'Home Country',
                value: user.profile.homeCountry
              },{
                name: 'Most interesting track',
                value: user.profile.mostInterestingTrack
              },
              {
                name: 'Applied for accommodation',
                value: user.profile.applyAccommodation,
                type: 'boolean'
              },
              {
                name: 'Applied for travel reimbursement',
                value: user.status.reimbursementApplied,
                type: 'boolean'
              },
              {
                name: 'Admitted reimbursement class',
                value: user.profile.AcceptedreimbursementClass || 'None'
              }
            ]
          },{
            name: 'Confirmation',
            fields: [
              {
                name: 'Shirt Size',
                value: user.confirmation.shirtSize,
                type: 'string'
              },{
                name: 'Needs Hardware',
                value: user.confirmation.needsHardware,
                type: 'boolean'
              }
            ]
          },
        ];
      }
      $scope.selectUser = selectUser;
  }]);