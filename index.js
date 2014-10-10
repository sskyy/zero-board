var _ = require('lodash'),
  q = require('q')



module.exports = {
  deps: ['request','bus','like','model','rest'],
  models : require('./models'),
  board : {},
  listen : {},
  strategy : {
    heat : function( model, key){
      var now = parseInt(new Date().getTime()),
        then = parseInt( new Date(model.createdAt).getTime()),
        hours = (now - then)/(1000*60*60)
      return model[key]/Math.pow(hours+1,1.5)
    }
  },
  expand : function(module){
    var root = this
    if( module.board ){
      _.extend( root.board, module.board)
      root.addListener( root.listen, module.board )
    }
  },
  addListener : function( listeners, board ){
    var root = this,
      models = root.dep.model.models

    _.forEach( board, function( config, modelName){
      config = _.defaults(config,{
        type : 'heat',
        limit : 100,
        key : 'like'
      })

      var boardName = modelName+"."+config.type

      listeners[modelName+".update.after"] = function updateScore( val ){
        var score = root.strategy[config.type](val, config.key)
        var bus = this
        //TODO update board
        return models['board'].findOne({name:boardName}).then(function( board){
          if( !(board.list.length < config.limit) && board.lowest > score ) return

          var existIndex = _.findIndex(board.list,{id:val.id})
          if( existIndex !==-1){
            board.list.splice( existIndex,1)
          }

          root.insertScore( board.list, {id:val.id,score:score})
          if( board.list.length > config.limit ){
            board.list.splice( config.limit-1)
          }
          board.lowest = board.list[board.list.length-1].score
          board.highest = board.list[0].score

          return bus.fire("board.update",{name:boardName},board)
        })
      }

    })
  },
  bootstrap:{
    "function":function(){
      var root = this,
        createBoardResults = []
      root.dep.bus.expand( this)

      console.log( root.board)
      _.forEach( root.board ,function( config, modelName){
        var boardName = modelName+"."+config.type
        console.log( root.dep.model.models['board'].findOne)
        var result = root.dep.model.models['board'].findOne({name:boardName}).then(function(board){
          console.log("creating board", board)
          return board || root.dep.model.models['board'].create({name:boardName,highest:0,lowest:0,list:[]})
        })
        createBoardResults.push(result)
      })

      return q.all( createBoardResults )
    },
    "order" : {after:"model.bootstrap"}
  },
  insertScore : function( list,obj) {

    if( list.length == 0  ){
      list.push(obj)
    }else if( list.length ==1 ){
      if( obj.score > list[0].score){
        list.unshift( obj)
      }else{
        list.push(obj)
      }
    }else{
      var head = 0, tail = list.length - 1
      while (head !== tail) {
        console.log(head, tail, obj.score, list[ Math.ceil((head + tail) / 2)])
        if (obj.score > list[ Math.ceil((head + tail) / 2)].score) {
          tail = Math.ceil((head + tail) / 2) - 1
        } else {
          head = Math.ceil((head + tail) / 2)
        }

      }
      var rest = list.splice(head + 1)
      list.push(obj)
      rest.forEach(function (i) {
        list.push(i)
      })
    }
    return list
  }
}