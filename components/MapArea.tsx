import DeckGL from '@deck.gl/react'
import { Feature, polygon, Properties, transformRotate } from '@turf/turf'
import { FeatureCollection, Geometry } from 'geojson'
import { computeDestinationPoint, getDistance, getRhumbLineBearing } from 'geolib'
import { Map } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useMemo, useState } from 'react'
import ReactMapGL, { Layer, LayerProps, Source, SourceProps, ViewportProps } from 'react-map-gl'
import { RoadFeature } from '../types/json'

const minzoom = 15

export const MapArea = () => {
  const [mapObj, setMapObj] = useState<Map>()
  const [peopleJson, setPeopleJson] = useState<FeatureCollection<Geometry>>({
    type: 'FeatureCollection',
    features: [],
  })
  const [peopleShadowJson, setPeopleShadowJson] = useState<FeatureCollection<Geometry>>({
    type: 'FeatureCollection',
    features: [],
  })
  const [carsJson, setCarsJson] = useState<FeatureCollection<Geometry>>({
    type: 'FeatureCollection',
    features: [],
  })
  const [carsShadowJson, setCarsShadowJson] = useState<FeatureCollection<Geometry>>({
    type: 'FeatureCollection',
    features: [],
  })
  const [viewport, setViewport] = useState<ViewportProps>({
    latitude: 35.610493335927146,
    longitude: 139.70963079522326,
    zoom: 11.548058916916952,
    pitch: 56.12617658004021,
    maxPitch: 70,
  })
  const mapGlLayers = useMemo<LayerProps[]>(
    () => [
      {
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 0.0],
          'sky-atmosphere-sun-intensity': 15,
        },
      },
      {
        id: 'add-3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: minzoom,
        paint: {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            minzoom,
            0,
            minzoom + 0.05,
            ['get', 'height'],
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            minzoom,
            0,
            minzoom + 0.05,
            ['get', 'min_height'],
          ],
        },
      },
    ],
    []
  )

  const vectorRoadId = 'vector-road'
  const sourceLayers = useMemo<{ id: string; source: SourceProps; layer: LayerProps }[]>(
    () => [
      {
        id: vectorRoadId,
        source: {
          type: 'vector',
          url: 'mapbox://mapbox.mapbox-streets-v8',
        },
        layer: {
          'source-layer': 'road',
          type: 'line',
          filter: ['in', 'class', 'trunk', 'primary'],
          paint: {
            // 'line-opacity': 0.6,
            // 'line-color': 'rgb(53, 175, 109)',
            'line-width': 0,
          },
        },
      },
      {
        id: 'cars-shadow',
        source: {
          type: 'geojson',
          data: carsShadowJson,
        },
        layer: {
          type: 'fill-extrusion',
          minzoom,
          paint: {
            'fill-extrusion-color': '#888',
            'fill-extrusion-height': 0,
          },
        },
      },
      {
        id: 'cars',
        source: {
          type: 'geojson',
          data: carsJson,
        },
        layer: {
          type: 'fill-extrusion',
          minzoom,
          paint: {
            'fill-extrusion-color': 'red',
            'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], minzoom, 3, 20, 0.75],
          },
        },
      },
      {
        id: 'cars-point',
        source: {
          type: 'geojson',
          data: carsJson,
        },
        layer: {
          type: 'circle',
          maxzoom: minzoom,
          paint: {
            'circle-radius': 2,
            'circle-stroke-color': 'red',
            'circle-color': 'white',
            'circle-stroke-width': 1,
          },
        },
      },
      {
        id: 'people-shadow',
        source: {
          type: 'geojson',
          data: peopleShadowJson,
        },
        layer: {
          type: 'fill-extrusion',
          minzoom: minzoom,
          paint: {
            'fill-extrusion-color': '#888',
            'fill-extrusion-height': 0,
          },
        },
      },
      {
        id: 'people',
        source: {
          type: 'geojson',
          data: peopleJson,
        },
        layer: {
          type: 'fill-extrusion',
          minzoom,
          paint: {
            'fill-extrusion-color': '#0084ff',
            'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], minzoom, 3, 20, 0.75],
          },
        },
      },
      {
        id: 'people-point',
        source: {
          type: 'geojson',
          data: peopleJson,
        },
        layer: {
          type: 'circle',
          maxzoom: minzoom,
          paint: {
            'circle-radius': 2,
            'circle-stroke-color': '#0084ff',
            'circle-color': 'white',
            'circle-stroke-width': 1,
          },
        },
      },
    ],
    [peopleJson]
  )

  useEffect(() => {
    const velocityPerMS = {
      walker: 4000 / 3600 / 1000,
      car: 40000 / 3600 / 1000,
    }
    let cancelId = 0
    const fn = () => {
      if (!mapObj) return

      const now = Date.now()
      const features = mapObj.queryRenderedFeatures(undefined, {
        layers: [vectorRoadId],
      }) as unknown as RoadFeature[]
      const roadList = features
        .map((f) =>
          f.geometry.type === 'MultiLineString'
            ? f.geometry.coordinates.map((c) =>
                c.slice(1).map((pos, i) => ({
                  startPos: c[i],
                  distance: getDistance(c[i], pos),
                  bearing: getRhumbLineBearing(
                    { lon: c[i][0], lat: c[i][1] },
                    { lon: pos[0], lat: pos[1] }
                  ),
                }))
              )
            : f.geometry.coordinates.slice(1).map((pos, i) => {
                if (f.geometry.type !== 'LineString') throw new Error('')

                return {
                  startPos: f.geometry.coordinates[i],
                  distance: getDistance(f.geometry.coordinates[i], pos),
                  bearing: getRhumbLineBearing(
                    { lon: f.geometry.coordinates[i][0], lat: f.geometry.coordinates[i][1] },
                    { lon: pos[0], lat: pos[1] }
                  ),
                }
              })
        )
        .flat(2)
        .reduce(
          ({ distanceFrom, lines }, line) => ({
            distanceFrom: distanceFrom + line.distance,
            lines: [
              ...lines,
              {
                ...line,
                distanceFrom,
                distanceTo: distanceFrom + line.distance,
              },
            ],
          }),
          {
            distanceFrom: 0,
            lines: [] as {
              startPos: [number, number]
              distance: number
              bearing: number
              distanceFrom: number
              distanceTo: number
            }[],
          }
        ).lines
      const totalDistance = roadList.reduce((dis, d) => dis + d.distance, 0)
      const step = Math.max(1, Math.floor(totalDistance / 250))
      const zoom = mapObj.getZoom()
      // const scale = zoom >= minzoom ? (1 / 2) ** mapObj.getZoom() * 2 ** 20 : 5
      const scale = zoom >= minzoom ? 2 : 4
      const list1 = roadList.map((road) => {
        const remain = road.distanceFrom % step
        const peopleList: Feature<Geometry, Properties>[] = []
        const shadowList: Feature<Geometry, Properties>[] = []
        const posList = [
          [0.25, 0],
          [0.25, 90],
          [Math.sqrt(2) * 0.25, 135],
          [0, 0],
          [Math.sqrt(2) * 0.25, 225],
          [0.25, 270],
        ]
        let n = 0
        while (road.distanceFrom + step * n - remain < road.distanceTo) {
          const point1 = computeDestinationPoint(
            computeDestinationPoint(
              road.startPos, // road.geometry.coordinates[0] を使うとずれる
              (step * n - remain + velocityPerMS.walker * now) % road.distance,
              road.bearing
            ),
            (Math.sin(n + 1) + 3.2) * scale,
            road.bearing + 90 * (n % 2 ? 1 : -1)
          )
          const point2 = computeDestinationPoint(
            computeDestinationPoint(
              road.startPos,
              (step * n - remain + velocityPerMS.walker * (10000000000000 - now)) % road.distance,
              road.bearing
            ),
            (Math.sin(n) + 3.3) * scale,
            road.bearing - 90 * (n % 2 ? 1 : -1)
          )

          try {
            peopleList.push(
              ...[point1, point2].map((p, i) => {
                if (zoom < minzoom)
                  return {
                    type: 'Feature' as const,
                    properties: {},
                    geometry: { type: 'Point' as const, coordinates: [p.longitude, p.latitude] },
                  }

                const poly = posList
                  .map(([d, r]) => computeDestinationPoint(p, d * scale, r))
                  .map(({ longitude, latitude }) => [longitude, latitude] as [number, number])
                return transformRotate(
                  polygon([[...poly, poly[0]]]),
                  road.bearing + (i % 2 ? 180 : 0)
                )
              })
            )
          } catch (e) {
            if (e instanceof Error) console.log(e.message)
          }

          // if (zoom >= minzoom) {
          //   try {
          //     shadowList.push(
          //       ...[point1, point2].map((p, i) => {
          //         const poly = posList
          //           .map(([d, r]) => computeDestinationPoint(p, d * scale * 1.5, r))
          //           .map(({ longitude, latitude }) => [longitude, latitude])

          //         return transformRotate(
          //           polygon([[...poly, poly[0]]]),
          //           road.bearing + (i % 2 ? 180 : 0)
          //         )
          //       })
          //     )
          //   } catch (e) {
          //     if (e instanceof Error) console.log(e.message)
          //   }
          // }
          n += 1
        }

        return { peopleList, shadowList }
      })

      setPeopleJson({
        type: 'FeatureCollection',
        features: list1.flatMap(({ peopleList }) => peopleList),
      })

      setPeopleShadowJson({
        type: 'FeatureCollection',
        features: list1.flatMap(({ shadowList }) => shadowList),
      })

      const carsStep = step * 20
      const list2 = roadList.map((road) => {
        const remain = road.distanceFrom % carsStep
        const carsList: Feature<Geometry, Properties>[] = []
        const shadowList: Feature<Geometry, Properties>[] = []
        const posList = [
          [0.5, 0],
          [0.5, 90],
          [1, 150],
          [0.5, 180],
          [1, 210],
          [0.5, 270],
        ]
        let n = 0
        while (road.distanceFrom + carsStep * n - remain < road.distanceTo) {
          const point1 = computeDestinationPoint(
            computeDestinationPoint(
              road.startPos,
              (carsStep * n - remain + velocityPerMS.car * now) % road.distance,
              road.bearing
            ),
            0.75 * scale,
            road.bearing - 90
          )

          const point2 = computeDestinationPoint(
            computeDestinationPoint(
              road.startPos,
              (carsStep * n - remain + velocityPerMS.car * (10000000000000 - now)) % road.distance,
              road.bearing
            ),
            0.75 * scale,
            road.bearing + 90
          )

          try {
            carsList.push(
              ...[point1, point2].map((p, i) => {
                if (zoom < minzoom)
                  return {
                    type: 'Feature' as const,
                    properties: {},
                    geometry: { type: 'Point' as const, coordinates: [p.longitude, p.latitude] },
                  }

                const poly = posList
                  .map(([d, r]) => computeDestinationPoint(p, d * scale, r))
                  .map(({ longitude, latitude }) => [longitude, latitude])
                return transformRotate(
                  polygon([[...poly, poly[0]]]),
                  road.bearing + (i % 2 ? 180 : 0)
                )
              })
            )
          } catch (e) {
            if (e instanceof Error) console.log(e.message)
          }

          // if (zoom >= minzoom) {
          //   try {
          //     shadowList.push(
          //       ...[point1, point2].map((p, i) => {
          //         const poly = posList
          //           .map(([d, r]) => computeDestinationPoint(p, d * scale * 1.25, r))
          //           .map(({ longitude, latitude }) => [longitude, latitude])
          //         return transformRotate(
          //           polygon([[...poly, poly[0]]]),
          //           road.bearing + (i % 2 ? 180 : 0)
          //         )
          //       })
          //     )
          //   } catch (e) {
          //     if (e instanceof Error) console.log(e.message)
          //   }
          // }

          n += 1
        }

        return { carsList, shadowList }
      })

      setCarsJson({
        type: 'FeatureCollection',
        features: list2.flatMap(({ carsList }) => carsList),
      })

      setCarsShadowJson({
        type: 'FeatureCollection',
        features: list2.flatMap(({ shadowList }) => shadowList),
      })
      cancelId = requestAnimationFrame(fn)
    }
    cancelId = requestAnimationFrame(fn)

    return () => {
      cancelAnimationFrame(cancelId)
    }
  }, [mapObj])

  return (
    <DeckGL
      initialViewState={viewport}
      controller
      width="100%"
      height="100%"
      onViewStateChange={(args) => setViewport(args.viewState)}
    >
      <ReactMapGL
        {...viewport}
        mapStyle="mapbox://styles/mapbox/streets-v10"
        width="100%"
        height="100%"
        mapboxApiAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        onLoad={(e) => setMapObj(e.target)}
      >
        {mapGlLayers.map((layer) => (
          <Layer key={layer.id} {...layer} />
        ))}
        {sourceLayers.map(({ id, source, layer }) => (
          <Source key={id} id={`${id}-source`} {...source}>
            <Layer id={id} {...layer} />
          </Source>
        ))}
      </ReactMapGL>
    </DeckGL>
  )
}
