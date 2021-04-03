

void setup() {
  size(640, 480, P2D);
  background(#FFFFFF);
}


void draw() {
  PShape hx = Hexagon(100);
  stroke(#FFAA00);
  shape(hx, 100, 100);
}
