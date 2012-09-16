class CollisionEngine
# CollisionManager owns a collection of collision rules
# Each rule takes two functions as inputs. First function, collision test method, returns a boolean value
# If this method returns true, meaning a collision has occurred, then the second function is executed
# The second method can be thought of as the collision response.
  constructor: ->
    this.rules = []
  register: (first_obj, second_obj, response_fn) ->
    this.rules.push(new CollisionRule(first_obj, second_obj, response_fn))
  run: ->
    for rule in this.rules
      if rule.execute()
        rule.response_fn(rule.first_obj, rule.second_obj) if rule.response_fn
        return true
    return false

class CollisionRule
  constructor: (first_obj, second_obj, @response_fn) ->
    this.first_obj  = first_obj
    this.second_obj = second_obj
  # Execute and return true if collision occurred and false otherwise
  execute: ->
    first  = this.first_obj.bounding_box()
    second = this.second_obj.bounding_box()
    if first.bottom < second.top
      false
    else if first.top > second.bottom
      false
    else if first.right < second.left
      false
    else if first.left > second.right
      false
    else
      true

class GameAsset
  constructor: ->
  draw: (context) ->
    alert "Error: No draw method was provided for game asset"

class BoundingBox extends GameAsset
  constructor: (upper_left_x, upper_left_y, width, height) ->
    this.left   = upper_left_x
    this.right  = upper_left_x + width
    this.top    = upper_left_y
    this.bottom = upper_left_y + height
  bounding_box: ->
    this

# Every GameAsset needs to define the following methods:
#   draw(context) => Given a drawing context draw yourself
#   bounding_box() => return a BoundingBox object that represents a box that encapsulates your object
class Platform extends BoundingBox 
  constructor: (@x_position, @y_position, @width, @height) -> 
  moveLeft: ->
    @x_position += 10
  moveTo: (new_x) ->
    @x_position = new_x
  draw: (context) ->
    context.fillRect(@x_position, @y_position, @width, @height)
  bounding_box: ->
    new BoundingBox(@x_position, @y_position, @width, @height)

class Ball extends BoundingBox
  constructor: (@x_position, @y_position, @radius) ->
    # Randomly decide if ball moves to left or right
    @velocity_x = 1
    if Math.random() >= 0.5
      @velocity_x = -1

    # Ball needs to initially be moving towards gamer's platform
    @velocity_y = 1
  moveNext: ->
    @x_position += 2*@velocity_x
    @y_position += 2*@velocity_y
  draw: (context) ->
    context.beginPath();
    context.arc(@x_position, @y_position, @radius, 0 , 2 * Math.PI, false);
    context.closePath();
    context.fill();
  bounding_box: ->
    new BoundingBox(@x_position, @y_position, @radius*2, @radius*2)

class Tile extends BoundingBox
  constructor: (@x_position, @y_position, @width, @height) ->
    this.is_alive = true
  draw: (context) ->
    if this.is_alive
      context.fillRect(@x_position, @y_position, @width, @height)
      context.strokeRect(@x_position, @y_position, @width, @height)
  bounding_box: ->
    new BoundingBox(@x_position, @y_position, @width, @height)

class GameManager
  constructor: (canvas_id, eventHandlers) ->
    this.canvas = document.getElementById(canvas_id)
    this.context = this.canvas.getContext("2d")
    this.collision_engine = new CollisionEngine()
    this.velocity_objects = []
    this.are_assets_initialized = false
    this.game_over = false

    # Start game loop
    window.setInterval(this.do_game, 10)

  do_game: ->
    if window.gameManager.game_over
      alert("Game Over!")
      window.gameManager.reset_game()
    else
      # update objects with velocities
      for object in window.gameManager.velocity_objects 
        object.moveNext()
      
      # perform collision checks
      window.gameManager.collision_engine.run()

      # draw next frame of game
      window.gameManager.draw_next_frame()

  reset_game: ->
    this.game_over = false
    for i in [0...(this.tiles.length)]
      this.tiles[i].is_alive = true

    this.ball.x_position = this.random_x()
    this.ball.y_position = 300

  # Are we ready to draw the next frame?
  is_ready: ->
    (this.context != null) && (this.are_assets_initialized)

  # These two methods determines random (x,y) starting positions for ball objects
  random_x: ->
    lower_x = this.canvas.width * 0.25
    upper_x = this.canvas.width * 0.75
    Math.round( (upper_x-lower_x+1)*Math.random()+lower_x )

  random_y: ->
    lower_y = this.canvas.height * 0.25
    upper_y = this.canvas.height * 0.50
    Math.round( (upper_y-lower_y+1)*Math.random()+lower_y )
    
  initialize_game_objects: ->
    this.right_wall  = new BoundingBox(this.canvas.width, 0, 0, this.canvas.height)
    this.left_wall   = new BoundingBox(0, 0, 0, this.canvas.height)
    this.top_wall    = new BoundingBox(0, 0, this.canvas.width, 0)
    this.bottom_wall = new BoundingBox(0, this.canvas.height, this.canvas.width, 0)
    this.platform    = new Platform(50, this.canvas.height-12, 100, 10)
    this.ball        = new Ball(this.random_x(), 300, 5)

    # Create tile matrix
    this.tiles = []
    upper_x = 5
    upper_y = 20
    width = 77 
    height = 42
    for x in [0..4]
      
      for y in [0..9]
        this.tiles.push(new Tile(upper_x, upper_y, width, height))
        upper_x += width
      upper_x = 5
      upper_y += height

    this.velocity_objects.push this.ball

    # Add collision rules
    this.collision_engine.register(this.platform, this.right_wall, ((first, second) ->
      first.moveTo window.gameManager.canvas.width-window.gameManager.platform.width
    ))
    this.collision_engine.register(this.platform, this.left_wall, ((first, second) ->
      first.moveTo 0
    ))
    this.collision_engine.register(this.ball, this.platform, ((first, second) -> 
      first.velocity_y = -first.velocity_y

      #MAX_X_SPEED = 2
      #ball_center   = first.x_position + first.radius
      #paddle_center = second.x_position + (second.width/2)
      #if ball_center < paddle_center
      #else if ball_center > paddle_center
    ))
    this.collision_engine.register(this.ball, this.right_wall, ((first, second) ->
      first.velocity_x = -first.velocity_x
    ))
    this.collision_engine.register(this.ball, this.left_wall, ((first, second) ->
      first.velocity_x = -first.velocity_x
    ))
    this.collision_engine.register(this.ball, this.top_wall, ((first, second) ->
      first.velocity_y = -first.velocity_y
    ))
    this.collision_engine.register(this.ball, this.bottom_wall, ((first, second) ->
      window.gameManager.game_over = true
    ))

    for i in [0...(this.tiles.length)]
      this.collision_engine.register(this.ball, this.tiles[i], ((first, second) ->
        second.is_alive = false
      ))

    this.are_assets_initialized = true

  draw_next_frame: ->
    if this.is_ready()
      # Clear canvas
      this.context.fillStyle = "rgb(0,0,0)"
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
      this.context.fillStyle = "rgb(255,255,255)"
      this.context.strokeStyle = "rgb(0,0,0)"

      this.platform.draw this.context
      for tile in this.tiles
        tile.draw this.context
      this.ball.draw this.context
    else
      alert "GameManager not ready to draw next frame!"


window.gameManager = new GameManager "game_screen"

# Initialize event handlers
window.onmousemove = ((e)-> window.gameManager.platform.moveTo e.pageX)
if window.captureEvents
  window.captureEvents(Event.MOUSEMOVE)
window.gameManager.initialize_game_objects()
window.gameManager.draw_next_frame()
