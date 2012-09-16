(function() {
  var Ball, BoundingBox, CollisionEngine, CollisionRule, GameAsset, GameManager, Platform, Tile,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  CollisionEngine = (function() {

    function CollisionEngine() {
      this.rules = [];
    }

    CollisionEngine.prototype.register = function(first_obj, second_obj, response_fn) {
      return this.rules.push(new CollisionRule(first_obj, second_obj, response_fn));
    };

    CollisionEngine.prototype.run = function() {
      var rule, _i, _len, _ref;
      _ref = this.rules;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        rule = _ref[_i];
        if (rule.execute()) {
          if (rule.response_fn) {
            rule.response_fn(rule.first_obj, rule.second_obj);
          }
          return true;
        }
      }
      return false;
    };

    return CollisionEngine;

  })();

  CollisionRule = (function() {

    function CollisionRule(first_obj, second_obj, response_fn) {
      this.response_fn = response_fn;
      this.first_obj = first_obj;
      this.second_obj = second_obj;
    }

    CollisionRule.prototype.execute = function() {
      var first, second;
      first = this.first_obj.bounding_box();
      second = this.second_obj.bounding_box();
      if (first.bottom < second.top) {
        return false;
      } else if (first.top > second.bottom) {
        return false;
      } else if (first.right < second.left) {
        return false;
      } else if (first.left > second.right) {
        return false;
      } else {
        return true;
      }
    };

    return CollisionRule;

  })();

  GameAsset = (function() {

    function GameAsset() {}

    GameAsset.prototype.draw = function(context) {
      return alert("Error: No draw method was provided for game asset");
    };

    return GameAsset;

  })();

  BoundingBox = (function(_super) {

    __extends(BoundingBox, _super);

    function BoundingBox(upper_left_x, upper_left_y, width, height) {
      this.left = upper_left_x;
      this.right = upper_left_x + width;
      this.top = upper_left_y;
      this.bottom = upper_left_y + height;
    }

    BoundingBox.prototype.bounding_box = function() {
      return this;
    };

    return BoundingBox;

  })(GameAsset);

  Platform = (function(_super) {

    __extends(Platform, _super);

    function Platform(x_position, y_position, width, height) {
      this.x_position = x_position;
      this.y_position = y_position;
      this.width = width;
      this.height = height;
    }

    Platform.prototype.moveLeft = function() {
      return this.x_position += 10;
    };

    Platform.prototype.moveTo = function(new_x) {
      return this.x_position = new_x;
    };

    Platform.prototype.draw = function(context) {
      return context.fillRect(this.x_position, this.y_position, this.width, this.height);
    };

    Platform.prototype.bounding_box = function() {
      return new BoundingBox(this.x_position, this.y_position, this.width, this.height);
    };

    return Platform;

  })(BoundingBox);

  Ball = (function(_super) {

    __extends(Ball, _super);

    function Ball(x_position, y_position, radius) {
      this.x_position = x_position;
      this.y_position = y_position;
      this.radius = radius;
      this.velocity_x = 1;
      if (Math.random() >= 0.5) {
        this.velocity_x = -1;
      }
      this.velocity_y = 1;
    }

    Ball.prototype.moveNext = function() {
      this.x_position += 2 * this.velocity_x;
      return this.y_position += 2 * this.velocity_y;
    };

    Ball.prototype.draw = function(context) {
      context.beginPath();
      context.arc(this.x_position, this.y_position, this.radius, 0, 2 * Math.PI, false);
      context.closePath();
      return context.fill();
    };

    Ball.prototype.bounding_box = function() {
      return new BoundingBox(this.x_position, this.y_position, this.radius * 2, this.radius * 2);
    };

    return Ball;

  })(BoundingBox);

  Tile = (function(_super) {

    __extends(Tile, _super);

    function Tile(x_position, y_position, width, height) {
      this.x_position = x_position;
      this.y_position = y_position;
      this.width = width;
      this.height = height;
      this.is_alive = true;
    }

    Tile.prototype.draw = function(context) {
      if (this.is_alive) {
        context.fillRect(this.x_position, this.y_position, this.width, this.height);
        return context.strokeRect(this.x_position, this.y_position, this.width, this.height);
      }
    };

    Tile.prototype.bounding_box = function() {
      return new BoundingBox(this.x_position, this.y_position, this.width, this.height);
    };

    return Tile;

  })(BoundingBox);

  GameManager = (function() {

    function GameManager(canvas_id, eventHandlers) {
      this.canvas = document.getElementById(canvas_id);
      this.context = this.canvas.getContext("2d");
      this.collision_engine = new CollisionEngine();
      this.velocity_objects = [];
      this.are_assets_initialized = false;
      this.game_over = false;
      window.setInterval(this.do_game, 10);
    }

    GameManager.prototype.do_game = function() {
      var object, _i, _len, _ref;
      if (window.gameManager.game_over) {
        alert("Game Over!");
        return window.gameManager.reset_game();
      } else {
        _ref = window.gameManager.velocity_objects;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          object = _ref[_i];
          object.moveNext();
        }
        window.gameManager.collision_engine.run();
        return window.gameManager.draw_next_frame();
      }
    };

    GameManager.prototype.reset_game = function() {
      var i, _i, _ref;
      this.game_over = false;
      for (i = _i = 0, _ref = this.tiles.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        this.tiles[i].is_alive = true;
      }
      this.ball.x_position = this.random_x();
      return this.ball.y_position = 300;
    };

    GameManager.prototype.is_ready = function() {
      return (this.context !== null) && this.are_assets_initialized;
    };

    GameManager.prototype.random_x = function() {
      var lower_x, upper_x;
      lower_x = this.canvas.width * 0.25;
      upper_x = this.canvas.width * 0.75;
      return Math.round((upper_x - lower_x + 1) * Math.random() + lower_x);
    };

    GameManager.prototype.random_y = function() {
      var lower_y, upper_y;
      lower_y = this.canvas.height * 0.25;
      upper_y = this.canvas.height * 0.50;
      return Math.round((upper_y - lower_y + 1) * Math.random() + lower_y);
    };

    GameManager.prototype.initialize_game_objects = function() {
      var height, i, upper_x, upper_y, width, x, y, _i, _j, _k, _ref;
      this.right_wall = new BoundingBox(this.canvas.width, 0, 0, this.canvas.height);
      this.left_wall = new BoundingBox(0, 0, 0, this.canvas.height);
      this.top_wall = new BoundingBox(0, 0, this.canvas.width, 0);
      this.bottom_wall = new BoundingBox(0, this.canvas.height, this.canvas.width, 0);
      this.platform = new Platform(50, this.canvas.height - 12, 100, 10);
      this.ball = new Ball(this.random_x(), 300, 5);
      this.tiles = [];
      upper_x = 5;
      upper_y = 20;
      width = 77;
      height = 42;
      for (x = _i = 0; _i <= 4; x = ++_i) {
        for (y = _j = 0; _j <= 9; y = ++_j) {
          this.tiles.push(new Tile(upper_x, upper_y, width, height));
          upper_x += width;
        }
        upper_x = 5;
        upper_y += height;
      }
      this.velocity_objects.push(this.ball);
      this.collision_engine.register(this.platform, this.right_wall, (function(first, second) {
        return first.moveTo(window.gameManager.canvas.width - window.gameManager.platform.width);
      }));
      this.collision_engine.register(this.platform, this.left_wall, (function(first, second) {
        return first.moveTo(0);
      }));
      this.collision_engine.register(this.ball, this.platform, (function(first, second) {
        return first.velocity_y = -first.velocity_y;
      }));
      this.collision_engine.register(this.ball, this.right_wall, (function(first, second) {
        return first.velocity_x = -first.velocity_x;
      }));
      this.collision_engine.register(this.ball, this.left_wall, (function(first, second) {
        return first.velocity_x = -first.velocity_x;
      }));
      this.collision_engine.register(this.ball, this.top_wall, (function(first, second) {
        return first.velocity_y = -first.velocity_y;
      }));
      this.collision_engine.register(this.ball, this.bottom_wall, (function(first, second) {
        return window.gameManager.game_over = true;
      }));
      for (i = _k = 0, _ref = this.tiles.length; 0 <= _ref ? _k < _ref : _k > _ref; i = 0 <= _ref ? ++_k : --_k) {
        this.collision_engine.register(this.ball, this.tiles[i], (function(first, second) {
          return second.is_alive = false;
        }));
      }
      return this.are_assets_initialized = true;
    };

    GameManager.prototype.draw_next_frame = function() {
      var tile, _i, _len, _ref;
      if (this.is_ready()) {
        this.context.fillStyle = "rgb(0,0,0)";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.fillStyle = "rgb(255,255,255)";
        this.context.strokeStyle = "rgb(0,0,0)";
        this.platform.draw(this.context);
        _ref = this.tiles;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          tile = _ref[_i];
          tile.draw(this.context);
        }
        return this.ball.draw(this.context);
      } else {
        return alert("GameManager not ready to draw next frame!");
      }
    };

    return GameManager;

  })();

  window.gameManager = new GameManager("game_screen");

  window.onmousemove = (function(e) {
    return window.gameManager.platform.moveTo(e.pageX);
  });

  if (window.captureEvents) {
    window.captureEvents(Event.MOUSEMOVE);
  }

  window.gameManager.initialize_game_objects();

  window.gameManager.draw_next_frame();

}).call(this);
