const assert = require('assert');
const State = require('../state.js');

function fakePayload(branch, number, status_message) {
  return { 
    repository: { name: 'main-repository' },
    branch: branch,
    number: number,
    status_message: status_message
  };
}

describe('Travis Script', function() {
  
  it('should display one branch', function() {
    let data = fakePayload('test-branch', 42, 'Pending');
    
    let state = new State();
    state.update(data);
    let map = state.buildMap();

    assert.deepEqual(map[0], { x:0, y:0, color: { r:255, g:255, b:0 } });
  });

  it('should display two branches', function() {
    let data = [
      fakePayload('test-branch-1', 11, 'Pending'),
      fakePayload('test-branch-2', 22, 'Passed'),
    ];
    
    let state = new State();
    data.forEach(function(payload) {
      state.update(payload);
    });
    let map = state.buildMap();

    assert.deepEqual(map[0], { x:0, y:0, color: { r:255, g:255, b:0 } });
    assert.deepEqual(map[1], { x:1, y:0, color: { r:0, g:255, b:0 } });
  });

  it('should display two branches from different repos', function() {
    let data = [
      fakePayload('dev-branch', 11, 'Pending'),
      fakePayload('dev-branch', 22, 'Passed'),
    ];
    data[0].repository.name = 'repo_one';
    data[1].repository.name = 'repo_two';

    let state = new State();
    data.forEach(function(payload) {
      state.update(payload);
    });
    let map = state.buildMap();

    assert.deepEqual(map[0], { x:0, y:0, color: { r:255, g:255, b:0 } });
    assert.deepEqual(map[1], { x:1, y:0, color: { r:0, g:255, b:0 } });
  });

  it('should ignore hooks from older builds', function() {
    let data = [
      fakePayload('test-branch-1', 22, 'Pending'),
      fakePayload('test-branch-1', 11, 'Passed'),
    ];
    
    let state = new State();
    assert.throws(function() {
      data.forEach(function(payload) {
        state.update(payload);
      });
    }, 'build is old');
  });

  it('should remember branch position', function() {
    let data = [
      fakePayload('test-branch-1', 22, 'Pending'),
      fakePayload('test-branch-2', 33, 'Passed'),
      fakePayload('test-branch-1', 22, 'Failed'),
    ];
    
    let state = new State();
    data.forEach(function(payload) {
      state.update(payload);
    });
    let map = state.buildMap();

    assert.deepEqual(map[0], { x:0, y:0, color: { r:255, g:0, b:0 } });
  });

  it('should free the position of the branch with the oldest build number', function() {
    let data = [];
    for (i=0; i<32; i++) {
      if (i == 1) {
        data.push(fakePayload('test-branch-' + i, 5, 'Pending'));
      } else {
        data.push(fakePayload('test-branch-' + i, i + 10, 'Pending'));
      }
    }
    data.push(fakePayload('mybranch', 100, 'Passed'));

    let state = new State();
    data.forEach(function(payload) {
      state.update(payload);
    });
    let map = state.buildMap();

    assert.deepEqual(map[1], { x:1, y:0, color: { r:0, g:255, b:0 } });
  });
});
