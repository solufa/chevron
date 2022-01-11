import { XMLParser } from 'fast-xml-parser'
import * as fs from 'fs'
import { getPreciseDistance, getRhumbLineBearing } from 'geolib'
import * as path from 'path'
import { RoadFeature } from '../types/json'

const parser = new XMLParser({ ignoreAttributes: false })
const obj: {
  'ksj:Dataset': {
    'gml:Curve': {
      '@_gml:id': string
      'gml:segments': {
        'gml:LineStringSegment': {
          'gml:posList': string
        }
      }
    }[]
    'ksj:Road': {
      '@_gml:id': string
      'ksj:location': { '@_xlink:href': `#${string}` }
      'ksj:routeName': string
    }[]
  }
} = parser.parse(fs.readFileSync(path.join(__dirname, 'road.xml'), 'utf8'))

const points = obj['ksj:Dataset']['gml:Curve']
  .flatMap(
    (c) =>
      c['gml:segments']['gml:LineStringSegment']['gml:posList'].split('\n').map((t: string) => ({
        gmlId: c['@_gml:id'],
        posTexts: t.trim(),
        coordinates: t
          .split(' ')
          .map((p) => +p)
          .reverse(),
      })),
    1
  )
  .map(({ gmlId, posTexts, coordinates }) => ({
    type: 'Feature',
    properties: { gmlId, posTexts },
    geometry: {
      type: 'Point',
      coordinates,
    },
  }))

// fs.writeFileSync(path.join(__dirname, 'points.json'), JSON.stringify(points, null, 2), 'utf8')

const tmp = obj['ksj:Dataset']['ksj:Road']
  .reduce(
    (list: { routeName: string; posTexts: string[][] }[], current) =>
      list.some((l) => l.routeName === current['ksj:routeName'])
        ? list.map((l) =>
            l.routeName === current['ksj:routeName']
              ? {
                  ...l,
                  posTexts: [
                    ...l.posTexts,
                    points
                      .filter(
                        (p) =>
                          p.properties.gmlId === current['ksj:location']['@_xlink:href'].slice(1)
                      )
                      .map((p) => p.properties.posTexts),
                  ],
                }
              : l
          )
        : [
            ...list,
            {
              routeName: current['ksj:routeName'],
              posTexts: [
                points
                  .filter(
                    (p) => p.properties.gmlId === current['ksj:location']['@_xlink:href'].slice(1)
                  )
                  .map((p) => p.properties.posTexts),
              ],
            },
          ],
    []
  )
  .map((t) => {
    const posTexts = [...t.posTexts]
    let index = 0

    t.posTexts.forEach(() => {
      const target = posTexts[index]
      for (let i = 0; i < posTexts.length; i += 1) {
        if (i === index) continue

        const pos = posTexts[i]
        if (target.slice(-1)[0] === pos[0]) {
          posTexts[i] = [...target, ...pos]
          posTexts.splice(index, 1)
          return
        } else if (target[0] === pos[0]) {
          posTexts[i] = [...[...target].reverse(), ...pos]
          posTexts.splice(index, 1)
          return
        } else if (target.slice(-1)[0] === pos.slice(-1)[0]) {
          posTexts[i] = [...pos, ...[...target].reverse()]
          posTexts.splice(index, 1)
          return
        } else if (target[0] === pos.slice(-1)[0]) {
          posTexts[i] = [...pos, ...target]
          posTexts.splice(index, 1)
          return
        }
      }

      index += 1
    })

    return {
      ...t,
      posTexts: posTexts.map((pos) => pos.filter((p, i, arr) => arr.indexOf(p) === i)),
    }
  })
// fs.writeFileSync(path.join(__dirname, 'tmp.json'), JSON.stringify(tmp, null, 2), 'utf8')

const colorNames: [number, number, number][] = [
  [255, 0, 0],
  [0, 0, 255],
  [75, 0, 130], // indigo
  [128, 0, 128], // purple
  [165, 42, 42], // brown
  [255, 0, 255], // fuchsia
  [50, 205, 50], // limegreen
  [0, 255, 255], // aqua
]

const tmpLines = tmp.flatMap((t, i) =>
  t.posTexts.flatMap((pos) => {
    const coodinates = pos.map(
      (p) =>
        p
          .split(' ')
          .map((n) => +n)
          .reverse() as [number, number]
    )

    return coodinates.slice(1).map((pos, n) => ({
      name: t.routeName,
      color: `rgb(${colorNames[i % colorNames.length].join(',')})` as const,
      coordinates: [coodinates[n], pos] as [[number, number], [number, number]],
    }))
  })
)

const { lines } = tmpLines
  .map((line) => ({
    type: 'Feature' as const,
    properties: {
      name: line.name,
      color: line.color,
      distance: getPreciseDistance(
        { lon: line.coordinates[0][0], lat: line.coordinates[0][1] },
        { lon: line.coordinates[1][0], lat: line.coordinates[1][1] }
      ),
      bearing: getRhumbLineBearing(
        { lon: line.coordinates[0][0], lat: line.coordinates[0][1] },
        { lon: line.coordinates[1][0], lat: line.coordinates[1][1] }
      ),
    },
    geometry: {
      type: 'LineString' as const,
      coordinates: line.coordinates,
    },
  }))
  .reduce(
    ({ distanceFrom, lines }, line) => ({
      distanceFrom: distanceFrom + line.properties.distance,
      lines: [
        ...lines,
        {
          ...line,
          properties: {
            ...line.properties,
            distanceFrom,
            distanceTo: distanceFrom + line.properties.distance,
            lonStart: line.geometry.coordinates[0][0],
            latStart: line.geometry.coordinates[0][1],
          },
        },
      ],
    }),
    { distanceFrom: 0, lines: [] as RoadFeature[] }
  )

fs.writeFileSync(path.join(__dirname, 'road.json'), JSON.stringify(lines, null, 2), 'utf8')
