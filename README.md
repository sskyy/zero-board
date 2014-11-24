# zero-board #

This module will make board like ~most popular~ of certain model records.

## Usage ##

1. Add dependency to your module package.json file like:

```
{
	"name" : "YOUR_MODULE_NAME",
	"zero" : {
		"dependencies" : {
			"board" : "^0.0.1"
		}
	}
}
```

2. Declare the board configuration in module.exports like:

```
module.exports = {
	board : {
       'artwork' : {
         type : 'heat', //which algorithm to make board
         limit : 100, //length of records in board
         key : 'like' //field name to calculate
       }
    }
}
```

The key in object board is the model type you want to make a board.


