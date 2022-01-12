export type RoadFeature = {
  type: 'Feature'
  properties: { class: string }
  geometry:
    | {
        type: 'MultiLineString'
        coordinates: [number, number][][]
      }
    | {
        type: 'LineString'
        coordinates: [[number, number], [number, number]]
      }
}
