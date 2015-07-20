'use strict';

angular.module('service-testing-tool').controller('TeststepsController', ['$scope', 'Teststeps', 'Assertions',
  '$location', '$stateParams', '$state', 'uiGridConstants', '$http', '_', '$timeout', 'PageNavigation',
  function($scope, Teststeps, Assertions, $location, $stateParams, $state, uiGridConstants, $http, _,
        $timeout, PageNavigation) {
    var teststepAutoSaveTimer;
    var assertionAutoSaveTimer;
    $scope.teststep = {};
    $scope.saveSuccessful = null;
    $scope.tempData = {};
    $scope.showAssertionsArea = false;
    $scope.showAssertionDetails = false;

    $scope.update = function(isValid) {
      if (isValid) {
        $scope.teststep.$update(function(response) {
          $scope.saveSuccessful = true;
          $scope.teststep = response;
        }, function(error) {
          $scope.savingErrorMessage = error.data.message;
          $scope.saveSuccessful = false;
        });
      } else {
        $scope.submitted = true;
      }
    };

    $scope.autoSave = function(isValid) {
      if (teststepAutoSaveTimer) $timeout.cancel(teststepAutoSaveTimer);
      teststepAutoSaveTimer = $timeout(function() {
        $scope.update(isValid);
      }, 2000);
    };

    $scope.loadWsdl = function() {
      $http
        .get('api/wsdls/anywsdl/operations', {
          params: {
            wsdlUrl: $scope.teststep.wsdlUrl
          }
        })
        .success(function(data, status) {
          $scope.teststep.wsdlBindings = data;
          $scope.teststep.wsdlBinding = $scope.teststep.wsdlBindings[0];
          $scope.teststep.wsdlOperations = $scope.teststep.wsdlBindings[0].operations;
          $scope.teststep.wsdlOperation = $scope.teststep.wsdlOperations[0];
        })
        .error(function(data, status) {
          alert('Error');
        });
    };

    $scope.refreshOperations = function() {
      $scope.wsdlOperations = _.findWhere($scope.wsdlBindings, { name: $scope.wsdlBinding.name }).operations;
      $scope.wsdlOperation = $scope.wsdlOperations[0];
    };

    $scope.create = function(isValid) {
      if (isValid) {
        var teststep = new Teststeps({
          testcaseId: $stateParams.testcaseId,
          name: this.teststep.name,
          description: this.teststep.description,
          wsdlUrl: this.teststep.wsdlUrl,
          wsdlBindingName: this.teststep.wsdlBinding.name,
          wsdlOperationName: this.teststep.wsdlOperation
        });
        teststep.$save(function(response) {
          $state.go('teststep_edit', {testcaseId: response.testcaseId, teststepId: response.id});
        }, function(error) {
          alert('Error');
        });
      } else {
        $scope.submitted = true;
      }
    };

    $scope.goto = function(state, params, expect) {
      var context = {
        model: $scope.teststep,
        url: $location.path(),
        expect: expect
      };

      PageNavigation.contexts.push(context);

      $state.go(state, params);
    };

    $scope.findOne = function() {
      // entry returned from other pages
      var model = PageNavigation.returns.pop();
      if (model) {
        $scope.teststep = model;
      } else {
        if ($stateParams.teststepId) {
          // edit an existing entry
          Teststeps.get({
            testcaseId: $stateParams.testcaseId,
            teststepId: $stateParams.teststepId
          }, function (response) {
            $scope.teststep = response;
          });
        } else {
          // create a new enventry
          $scope.teststep.testcaseId = $stateParams.testcaseId;
        }
      }
    };

    $scope.invoke = function(teststep) {
       var url = 'api/testcases/' + $stateParams.testcaseId + '/teststeps/' + $stateParams.teststepId + '/invoke';
       $http
        .post(url, {
          soapAddress: $scope.teststep.soapAddress,
          request: $scope.teststep.request
        })
        .success(function(data, status) {
          $scope.tempData.response = data.response;
        })
        .error(function(data, status) {
          alert('Error');
        });
    };

    $scope.toggleAssertionsArea = function() {
      document.getElementById('request-response-textareas').style.height =
        (document.getElementById('request-response-textareas').offsetHeight +
        document.getElementById('assertionsArea').offsetHeight) + 'px';

      $scope.showAssertionsArea = !($scope.showAssertionsArea);
    };

    $scope.assertionsAreaVisibleCallback = function() {
      document.getElementById('request-response-textareas').style.height =
          (document.getElementById('request-response-textareas').offsetHeight -
          document.getElementById('assertionsArea').offsetHeight) + 'px';

      $scope.findAssertions();
    };

    $scope.findAssertions = function() {
      Assertions.query(
        {
          testcaseId: $stateParams.testcaseId,
          teststepId: $stateParams.teststepId
        }, function(response) {
          $scope.assertions = response;
        }, function(error) {
          alert('Error');
        });
    };

    $scope.assertionColumnDefs = [
      {
        name: 'name', width: 250, minWidth: 250,
        sort: {
          direction: uiGridConstants.ASC,
          priority: 1
        },
        cellTemplate: 'assertionGridNameCellTemplate.html'
      },
      {name: 'type', width: 100, minWidth: 100},
      {name: 'delete', width: 100, minWidth: 100, enableSorting: false,
        cellTemplate: 'assertionGridDeleteCellTemplate.html'
      }
    ];

    $scope.createContainsAssertion = function() {
      var assertion = new Assertions({
        teststepId: $stateParams.teststepId,
        name: 'Response contains value',
        type: 'Contains',
        properties: { contains: 'value' }
      });

      assertion.$save({
        testcaseId: $stateParams.testcaseId,
        teststepId: $stateParams.teststepId
      }, function(response) {
        $scope.assertion = response;
        $scope.findAssertions();
      }, function(error) {
        alert('Error');
      });

      $scope.showAssertionDetails = true;
    };

    $scope.updateAssertion = function(isValid) {
      if (isValid) {
        $scope.assertion.$update({
          testcaseId: $stateParams.testcaseId,
          teststepId: $stateParams.teststepId
        }, function(response) {
          $scope.saveSuccessful = true;
           $scope.assertion = response;
           $scope.findAssertions();
        }, function(error) {
          $scope.savingErrorMessage = error.data.message;
          $scope.saveSuccessful = false;
        });
      } else {
        $scope.submitted = true;
      }
    };

    $scope.autoSaveAssertion = function(isValid) {
      if (assertionAutoSaveTimer) $timeout.cancel(assertionAutoSaveTimer);
      assertionAutoSaveTimer = $timeout(function() {
        $scope.updateAssertion(isValid);
      }, 2000);
    };
  }
]);
