// Quick script to convert JSON output from TexturePacker to a format recognized by racer.
// Meant to be run in a console.

list.forEach(function(e) {
   console.log(e.filename.substring(0,e.filename.length-4).toUpperCase().trimRight("_")+": { x: ",e.frame.x,", y: ",e.frame.y,", w: ",e.frame.w,", h: ",e.frame.h," },");
});