angular.module('reg')
  .controller('ApplicationCtrl', [
    '$scope',
    '$rootScope',
    '$state',
    '$http',
    'currentUser',
    'settings',
    'Session',
    'UserService',
    'SettingsService',
    function($scope, $rootScope, $state, $http, currentUser, Settings, Session, UserService, SettingsService){
      $scope.isDisabled = false;
      $scope.goesNotToSchool = false;
      $scope.goesToSchool = false;
      // Set up the user

      $scope.user = currentUser.data;
      if ($scope.user.profile.school) {
        $('#goesToSchool').prop('checked', true)
        $scope.goesToSchool = true
        $scope.goesNotToSchool = false 
      } else if ($scope.user.profile.oldDegree) {
        $('#goesNotToSchool').prop('checked', true)
        $scope.goesNotToSchool = true
        $scope.goesToSchool = false
        $scope.oldDegreeChecked = true
      }

      if($scope.user.profile.mainRole) {
        $scope.roleSelected = true
      }
      if($scope.user.profile.terminal.essay) {
        $scope.interestedTerminal = true
      }

      if($scope.user.profile.terminal.needsAccommodation) {
        $('#livesNotInHelsinkiArea').prop('checked', true)
        $scope.livesNotInHelsinki = true
      }

      if($scope.user.profile.terminal.livesInHelsinkiArea) {
        $('#livesInHelsinkiArea').prop('checked', true)
        $scope.livesInHelsinki = true
        if($scope.user.profile.terminal.accommodatesAmount) {
          $('#accommodatesPeople').prop('checked', true)
          $scope.accommodatesPeople = true
        }
        else if($scope.user.profile.terminal.accommodatesPeople === false) {
          $('#accommodatesNotPeople').prop('checked', true)
        }
      }


      $scope.openApplicationModal = function() {
        $('.ui.chart')
          .modal('show')
      }

      $scope.openNoteModal = function(teamSelection) {
        if(teamSelection === 'onlyTeam' || teamSelection === 'teamOrAlone') {
          $('.ui.note')
            .modal('show')
        }
      }

      $scope.openLegalModal = function() {
        $('.ui.legal')
          .modal('show') 
      }

      $scope.setSchoolYes = function() {
        $('#goesNotToSchool').prop('checked', false)
        $scope.goesToSchool = !($scope.goesToSchool)
        $scope.goesNotToSchool = false
      }

      $scope.setSchoolNo = function() {
        $('#goesToSchool').prop('checked', false)
        $scope.goesToSchool = false
        $scope.goesNotToSchool = !($scope.goesNotToSchool)
      }

      $scope.setLivesInHelsinki = function(setting) {
        if(setting === "yes") {
          $scope.livesInHelsinki = true
          $scope.user.profile.terminal.livesInHelsinkiArea = true
          $scope.livesNotInHelsinki = false
        } else {
          $scope.livesInHelsinki = false
          $scope.livesNotInHelsinki = true
          $scope.user.profile.terminal.livesInHelsinkiArea = false
        }
      }

      $scope.setAccommodation = function(setting) {
        if(setting === "yes") {
          $scope.accommodatesPeople = true
          $scope.user.profile.terminal.accommodatesPeople = true
        } else {
          $scope.accommodatesPeople = false
          $scope.user.profile.terminal.accommodatesPeople = false
          $scope.user.profile.terminal.accommodatesAmount = undefined
        }
      }

      $scope.setRoleSelected = function(role) {
        if(role === 'Developer' || role === 'Designer' || role === 'Business') {
          $scope.roleSelected = true
        }
      }
      $scope.setSubRoleSelected = function(role) {
        if(role === 'Developer' || role === 'Designer' || role === 'Business') {
          $scope.subRoleSelected = true
        }
      }
      var originalTeamCode = $scope.user.teamCode;

      //icon tooltip popup
      $('.icon')
      .popup({
        on: 'hover'
      });

      var languages = ['AngularJS', 'Assembly', 'Bash', 'C', 'C#', 'C++', 'Clojure',
                       'CoffeeScript', 'CSS', 'Excel', 'Go', 'Groovy', 'Haskell', 'HTML',
                       'Java', 'JavaScript', 'Kotlin', 'Lua', 'Matlab', 'Node.js',
                       'Objective-C', 'Perl', 'PHP', 'PowerPoint', 'Python', 'Qt', 'R', 'React',
                       'Ruby', 'Scala', 'SQL', 'Swift', 'TypeScript', 'VBA', 'VB.NET',
                       'Visual Basic 6', '.NET Core', 'Other'];
      $scope.programmingLanguages = languages;
      // Populate the school dropdown
      _setupForm();

      $scope.regIsClosed = Date.now() > Settings.data.timeClose || $scope.user.status.admitted;
      $scope.specialRegClosed = Date.now() > Settings.data.timeCloseSpecial;

      $scope.specialOpen = !$scope.specialRegClosed && $scope.user.specialRegistration

      $scope.formClosed = $scope.regIsClosed && !$scope.specialOpen

      var reimbClasses;
      $.getJSON('../assets/reimbClasses.json').done(function(data){
              reimbClasses = data;
      });

      function _updateUser(e){
        // Update user profile
        UserService
          .updateProfile(Session.getUserId(), $scope.user.profile, $scope.user.specialRegistration)
          .success(function(data){
            sweetAlert({
              title: "Awesome!",
              text: "Your application has been saved.",
              type: "success",
              confirmButtonColor: "#5ABECF"
            }, function(){
              $state.go('app.dashboard');
            });
          })
          .error(function(res){
            sweetAlert("Uh oh!", "Something went wrong.", "error");
          });
      }
      $scope.getReimbursementClass = function(homeCountry) {
        // User needs reimbursement
        if($scope.user.profile.needsReimbursement) {
          $scope.user.profile.AppliedreimbursementClass = reimbClasses[homeCountry].Class;
          }
      }

      function _updateTeam(e) {
        // Update user teamCode
        if ($scope.user.teamCode === originalTeamCode || !$scope.user.teamCode) {
          return;
        }

        UserService
          .joinOrCreateTeam($scope.user.teamCode)
          .success(function(user){
            return;
          })
          .error(function(res){
            return;
          });
      }

      function _updateSchools() {
        if (Settings.data.schools.indexOf($scope.user.profile.school) === -1 && $scope.user.profile.school !== null) {
          SettingsService.addSchool($scope.user.profile.school)
          .success(function(user){
            return;
          })
          .error(function(res){
            console.log("Failed to add new school");
          });
        }
      }

      function _updateSkills() {
        const profile = $scope.user.profile
        const skills = profile.beginnerSkills.concat(profile.intermediateSkills).concat(profile.advancedSkills).concat(profile.professionalSkills)
        if(skills.length){
          skills.forEach(function(skill) {
            if (Settings.data.skills.indexOf(skill) === -1 && skill !== null) {
              SettingsService.addSkill(skill)
              .success(function(user){
                return;
              })
              .error(function(res){
                console.log(`Failed to add new skill ${skill}`);
              });
            }
          })
        }
      }

      function _setupForm(){
        // Semantic-UI form validation
        $('.ui.form').form({
          inline:true,
          fields: {
            name: {
              identifier: 'name',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your name.'
                }
              ]
            },
            age: {
              identifier: 'age',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your age.'
                },
                {
                  type: 'integer[13..1000]',
                  prompt: 'You must be at least 13 to attend.'
                },
                {
                  type: 'integer[0..99]',
                  prompt: 'You must be under 100 years old to attend.'
                }
              ]
            },
            school: {
              identifier: 'school',
              depends: 'goesToSchool',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your school.'
                },
                {
                  type: 'doesntContain[undefined]',
                  prompt: 'Something is wrong with your school name, try selecting it again.'
                },
                {
                  type: 'doesntContain[?string:]',
                  prompt: 'Something is wrong with your school name, try selecting it again.'
                }
              ]
            },
            secret: {
              identifier: 'secret',
              rules: [
                {
                  type: 'maxLength[300]',
                  prompt: 'This is too long! Max. 300 characters'
                }
              ]
            },
            skills: {
              identifier: 'skills',
              rules: [
                {
                  type: 'minCount[1]',
                  prompt: 'Please select in at least one skill, you have some for sure!'
                },
                {
                  type: 'doesntContain[undefined]',
                  prompt: 'Something is wrong with your skills name, try selecting some of them again.'
                }
              ]
            },
            graduationYear: {
              identifier: 'graduationYear',
              depends: 'goesToSchool',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your graduation year.'
                },
                {
                  type: 'integer[2017..2040]',
                  prompt: 'Your graduation year should be something sensible.'
                },
              ]
            },
            degree: {
              identifier: 'degree',
              depends: 'goesToSchool',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your degree.'
                }
              ]
            },
            major: {
              identifier: 'major',
              depends: 'goesToSchool',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your major.'
                }
              ]
            },
            oldDegree: {
              identifier: 'oldDegree',
              depends: 'oldDegreeChecked',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your degree.'
                }
              ]
            },
            oldMajor: {
              identifier: 'oldDegreeMajor',
              depends: 'oldDegreeChecked',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your major.'
                }
              ]
            },
            oldDegreeGraduation: {
              identifier: 'oldDegreeGraduation',
              depends: 'oldDegreeChecked',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your graduation year.'
                }
              ]
            },
            travelFromCountry: {
              identifier: 'travelFromCountry',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select the country you are travelling from.'
                }
              ]
            },
            travelFromCity: {
              identifier: 'travelFromCity',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select the city you are travelling from.'
                }
              ]
            },
            homeCountry: {
              identifier: 'homeCountry',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select your home country.'
                }
              ]
            },
            jobOpportunities: {
              identifier: 'jobOpportunities',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select if you are interested in job opportunities.'
                }
              ]
            },
            yearsOfExperience: {
              identifier: 'yearsOfExperience',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select years of experience.'
                }
              ]
            },
            bestTools: {
              identifier: 'bestTools',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select your best tools.'
                }
              ]
            },
            howManyHackathons: {
              identifier: 'howManyHackathons',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select how many hackathons you have attended.'
                }
              ]
            },
            description: {
              identifier: 'description',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select your role in a hackathon team.'
                }
              ]
            },
            mostInterestingThemes: {
              identifier: 'mostInterestingThemes',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select at least one theme'
                }
              ]
            },
            mainRole: {
              identifier: 'mainRole',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select one of the main roles to describe yourself'
                }
              ]
            },
            bestRole: {
              identifier: 'bestRole',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select a best describing role.'
                }
              ]
            },
            occupationalStatus: {
              identifier: 'occupationalStatus',
              rules: [
                {
                  type: 'maxCount[2]',
                  prompt: 'Please select at most 2.'
                },
                {
                type: 'empty',
                prompt: 'Please select your occupational status.'
                }
              ]
            },
            gender: {
              identifier: 'gender',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select a gender.'
                }
              ]
            },
            conduct: {
              identifier: 'conduct',
              rules: [
                {
                  type: 'checked',
                  prompt: 'You must accept MLH code of conduct to continue.'
                }
              ]
            },
            termsAndCond: {
              identifier: 'termsAndCond',
              rules: [
                {
                  type: 'checked',
                  prompt: 'You must accept Junction Terms & Conditions.'
                }
              ]
            },
            essay: {
              identifier: 'essay',
              rules: [
                {
                  type: 'maxLength[1500]',
                  prompt: 'This is too long! Max. 1500 characters'
                }
              ]
            },
            terminalEssay: {
              identifier: 'terminalEssay',
              depends: 'terminal',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please write something about why you should be chosen to Terminal.'
                },
                {
                  type: 'maxLength[1000]',
                  prompt: 'This is too long! Max. 1000 characters'
                }
              ]
            },
            terminalSkills: {
              identifier: 'terminalSkills',
              depends: 'terminal',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please write something about your skills.'
                }
              ]
            },
            teamSelection: {
              identifier: 'teamSelection',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select one option'
                }
              ]
            }
          },
          onSuccess: function(event, fields){
            _updateTeam();
            _updateSchools();
            _updateUser();
            _updateSkills();
          },
          onFailure: function(formErrors, fields){
            $scope.fieldErrors = formErrors;
            $scope.error = 'There were errors in your application. Please check that you filled all required fields.';
          }
        });
        // Set selected multiselect items
        $("#spacesOrTabs").dropdown('set selected', $scope.user.profile.spacesOrTabs);
        $("#operatingSystem").dropdown('set selected', $scope.user.profile.operatingSystem);
        $("#jobOpportunities").dropdown('set selected', $scope.user.profile.jobOpportunities);
        $("#description").dropdown('set selected', $scope.user.profile.description);
        $("#howManyHackathons").dropdown('set selected', $scope.user.profile.howManyHackathons);
        $("#codingExperience").dropdown('set selected', $scope.user.profile.codingExperience);
        $("#mostInterestingTrack").dropdown('set selected', $scope.user.profile.mostInterestingTrack);
        $("#gender").dropdown('set selected', $scope.user.profile.gender);
        $("#homeCountry").dropdown('set selected', $scope.user.profile.homeCountry);
        $("#travelFromCountry").dropdown('set selected', $scope.user.profile.travelFromCountry);
        $("#occupationalStatus").dropdown('set selected', $scope.user.profile.occupationalStatus);
        $("#degree").dropdown('set selected', $scope.user.profile.degree);
        $("#workingLanguages").dropdown('set selected', $scope.user.profile.workingLanguages);
        $("#mostInterestingThemes").dropdown('set selected', $scope.user.profile.mostInterestingThemes);
        $("#mainRole").dropdown('set selected', $scope.user.profile.mainRole);
        $("#subRole").dropdown('set selected', $scope.user.profile.subRole);
        $("#teamSelection").dropdown('set selected', $scope.user.profile.teamSelection);
        $("#previousJunction").dropdown('set selected', $scope.user.profile.previousJunction);
        $("#heardAboutJunction").dropdown('set selected', $scope.user.profile.heardAboutJunction);
        $("#bestRole").dropdown('set selected', $scope.user.profile.bestRole);
        $("#yearsOfExperience").dropdown('set selected', $scope.user.profile.yearsOfExperience);
        $("#secondBestRole").dropdown('set selected', $scope.user.profile.secondBestRole)
        $("#terminalIndustries").dropdown('set selected', $scope.user.profile.terminal ? $scope.user.profile.terminal.terminalIndustries : "");
        $(".oldDegree").dropdown('set selected', $scope.user.profile.oldDegree ? $scope.user.profile.oldDegree.degree : "");
        $('.ui.dropdown').dropdown('refresh');
        $(".ui.beginnerSkills").dropdown('set selected', $scope.user.profile.beginnerSkills);
        $(".ui.intermediateSkills").dropdown('set selected', $scope.user.profile.intermediateSkills);
        $(".ui.advancedSkills").dropdown('set selected', $scope.user.profile.advancedSkills);
        $(".ui.professionalSkills").dropdown('set selected', $scope.user.profile.professionalSkills);
        $(".ui.language").dropdown('set selected', $scope.user.profile.workingLanguages);

        setTimeout(function () {
          
          $(".ui.toptools.dropdown").dropdown('set selected', $scope.user.profile.topLevelTools);
          $(".ui.school").dropdown('set selected', $scope.user.profile.school);
          $("#greatLevelTools").dropdown('set selected', $scope.user.profile.greatLevelTools);
          $("#goodLevelTools").dropdown('set selected', $scope.user.profile.goodLevelTools);
          $("#beginnerLevelTools").dropdown('set selected', $scope.user.profile.beginnerLevelTools);

          if ($scope.regIsClosed && !$scope.specialOpen) {
            $('.ui.dropdown').addClass("disabled");
          }

        }, 1);
      }

      $scope.submitForm = function(){
        if ($scope.goesToSchool) {
          $scope.user.profile.oldDegree = null
        }
        else if ($scope.goesNotToSchool) {
          $scope.user.profile.school = null;
          $scope.user.profile.graduationYear = null;
          $scope.user.profile.degree = null;
          $scope.user.profile.major = null;
        }
        if($scope.accommodatesPeople) {
          $scope.user.profile.terminal.needsAccommodation = false
        }
        else if($scope.needsAccommodation) {
          $scope.user.profile.terminal.accommodatesPeople = undefined
        }
        $scope.fieldErrors = null;
        $scope.error = null;
        $('.ui.form').form('validate form');
      };
}])
.filter('exclude', function () {
  return function (items, languages, dropdownIdentifier) {

    var selectedLanguages = [];
    selectedLanguages.push($(".ui.toptools.dropdown").dropdown('get value'));
    selectedLanguages.push($(".ui.greattools.dropdown").dropdown('get value'));
    selectedLanguages.push($(".ui.goodtools.dropdown").dropdown('get value'));
    selectedLanguages.push($(".ui.beginnerTools.dropdown").dropdown('get value'));
    selectedLanguages = [].concat.apply([], selectedLanguages);
    // Strip the unnecessary 'string:' substring
    selectedLanguages = stripLanguageSubstrings(selectedLanguages);
    var callerLanguages = $(dropdownIdentifier).dropdown('get value');
    callerLanguages = [].concat.apply([], callerLanguages);
    callerLanguages = stripLanguageSubstrings(callerLanguages);

    // Finally, remove the selected languages from dropdown options
    var remaining = languages.filter( function( el ) {
      return !selectedLanguages.includes( el ) || callerLanguages.includes(el);
    } );
    return remaining;
  };
});

function findSelectedValues() {
  return selectedLanguages;
}

function stripLanguageSubstrings(langs) {
  langs.forEach(function(part, index, theArray) {
    theArray[index] = theArray[index].replace("string:", "");
  });

  return langs;
}
