export type RoadFeature = {
  type: 'Feature'
  properties: {
    name: string
    color: `rgb(${string})`
    distance: number
    distanceFrom: number
    distanceTo: number
    bearing: number
    lonStart: number
    latStart: number
  }
  geometry: {
    type: 'LineString'
    coordinates: [[number, number], [number, number]]
  }
}
