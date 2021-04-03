  PShape hexShape(float size, color fill, color edge, float thickness) {
  PShape hexagon = createShape();
  
  size = size /100;

  hexagon.beginShape();
  hexagon.fill(fill);
  hexagon.stroke(edge);
  hexagon.strokeWeight(thickness);
  
  hexagon.vertex(75*size, 7*size);
  hexagon.vertex(25*size, 7*size);
  hexagon.vertex(0*size, 50*size);
  hexagon.vertex(25*size, 93*size);
  hexagon.vertex(75*size, 93*size);
  hexagon.vertex(100*size, 50*size);

  hexagon.endShape(CLOSE);

  return hexagon;
}
class Hex{
  HexMap parent;
  

}

class HexMap{
  Hex[] hexagons;
  int w;
  int h;
  
  HexMap(int w, int h){
    this.w = w;
    this.h = h;
    hexagons = new Hex[h*w];
    for(int i = 0; i < h*w; i++){
      hexagons[i] = new Hex();
    }
  }
  
  int coordIndex(int x, int y){
    return hexagons.get();
  }
  
}
