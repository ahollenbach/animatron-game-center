# Thanks to http://www.blender.org/forum/viewtopic.php?t=19102 for the inspiration

# Automatically renders the scene at varying angles
# Usage: "blender.exe -b <filename>.blend -P render.py"

import bpy, bgl, blf, math
from bpy import data, ops, props, types, context

sceneKey = bpy.data.scenes.keys()[0];
camera = bpy.data.objects["Camera"]

# The location z values mapped to the three tilt states, up, straight, and down
# You can use this to get the x-rotation displacement, by using val*-5
tilts = { 
          "up"  : 1,
          ""    : 0,
          "down":-1
        }

# The different turns, index matters
# You can retrive the z-rotation as follows:
#    if(i<3)  -> -2^(i-3)
#    if(i==3) -> 0
#    if(i>3)  -> 2^(i-3)
# You can retrieve the x location relative to the rotation using z-rotation/5
turns = ["drift_left","left_2","left","straight","right","right_2", "drift_right"]

for tiltName in tilts.keys():
  for i in range(len(turns)):
    tilt = tilts[tiltName]

    rz = 0
    if i<3:
      rz = -math.pow(2,abs(i-3))
    elif i>3:
      rz = math.pow(2,abs(i-3))

    #assign camera state
    camera.location.x       = 0               + rz/5
    camera.location.y       = -15
    camera.location.z       = 2               + tilt
    camera.rotation_euler.x = math.radians(85 + tilt*-5)
    camera.rotation_euler.y = math.radians(0           )
    camera.rotation_euler.z = math.radians(0  + rz     )

    # Set scene's camera and output filename
    bpy.data.scenes[sceneKey].camera = camera
    bpy.data.scenes[sceneKey].render.image_settings.file_format = 'PNG'
    bpy.data.scenes[sceneKey].render.filepath = 'images/new_car/car_' + turns[i] + "_" + tiltName

    # Render Scene and store the scene
    bpy.ops.render.render( write_still=True )

print('Done!')