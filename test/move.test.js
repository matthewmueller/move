
var prefix = require('prefix')
var chai = require('./chai')
var move = require('..')

var transform = prefix('transform')

var box
var mv
beforeEach(function(){
  spy = chai.spy()
  box = document.createElement('div')
  document.body.appendChild(box)
  mv = move(box).duration(10)
})

afterEach(function(){
  document.body.removeChild(box)
})

describe('move', function(){
  describe('.set()', function(){
    it('should handle default types', function(){
      mv.set('opacity', 0)
        .set('margin', 5)
        .frame(.5)
        .should.eql({
          margin: '2.5px',
          opacity: .5,
        })
    })
  })

  describe('.then()', function(){
    it('should support passing in move instances', function(done){
      var next = move(box).duration(10)
      mv.on('end', spy)
      mv.then(next).should.equal(mv)
      next.on('end', function(){
        spy.should.have.been.called(1)
        done()
      })
    })

    it('should pull current value down from grandparents', function(){
      var frame = {}
      frame[transform] = 'translateX(4px)translateY(0px)rotate(0deg)skew(0deg)scaleX(1)scaleY(1)'
      var obj = mv.x(5).then().then().x(-2).frame(.5)
      obj.should.eql(frame)
    })

    it('should not auto-run deferred moves', function(done){
      var a = mv.x(5).on('end', function(){
        b.frame.should.not.have.been.called()
        done()
      })
      var b = a.then()
      b.frame = spy
      var c = b.then()
    })
  })
})
