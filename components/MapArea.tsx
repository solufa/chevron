import DeckGL from '@deck.gl/react'
import { Feature, polygon, Properties, transformRotate } from '@turf/turf'
import { FeatureCollection, Geometry } from 'geojson'
import { computeDestinationPoint } from 'geolib'
import { Map } from 'mapbox-gl'
import { useEffect, useMemo, useState } from 'react'
import ReactMapGL, { Layer, LayerProps, Source, SourceProps, ViewportProps } from 'react-map-gl'
import { RoadFeature } from '../types/json'

// eslint-disable-next-line
const roadFeatures: RoadFeature[] = require('../tasks/road.json')

export const MapArea = () => {
  const [mapObj, setMapObj] = useState<Map>()
  const [peopleJson, setPeopleJson] = useState<FeatureCollection<Geometry>>({
    type: 'FeatureCollection',
    features: [],
  })
  const [carsJson, setCarsJson] = useState<FeatureCollection<Geometry>>({
    type: 'FeatureCollection',
    features: [],
  })
  const [viewport, setViewport] = useState<ViewportProps>({
    latitude: 35.690921,
    longitude: 139.70025799999996,
    zoom: 10,
    maxPitch: 80,
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
        minzoom: 15,
        paint: {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'height'],
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'min_height'],
          ],
          'fill-extrusion-opacity': 0.6,
        },
      },
    ],
    []
  )

  const linesLayerId = 'lines-data'
  const sourceLayers = useMemo<{ source: SourceProps; layer: LayerProps }[]>(
    () => [
      {
        source: {
          id: 'people-data',
          type: 'geojson',
          data: peopleJson,
        },
        layer: {
          id: 'people',
          type: 'fill-extrusion',
          minzoom: 17,
          paint: {
            'fill-extrusion-color': '#0084ff',
            'fill-extrusion-height': 0.5,
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.6,
          },
        },
      },
      {
        source: {
          id: 'people-point-data',
          type: 'geojson',
          data: peopleJson,
        },
        layer: {
          id: 'people-point',
          type: 'circle',
          maxzoom: 17,
          paint: {
            'circle-radius': 2,
            'circle-stroke-color': '#0084ff',
            'circle-color': 'white',
            'circle-stroke-width': 1,
          },
        },
      },
      {
        source: {
          id: 'cars-data',
          type: 'geojson',
          data: carsJson,
        },
        layer: {
          id: 'cars',
          type: 'fill-extrusion',
          minzoom: 17,
          paint: {
            'fill-extrusion-color': 'red',
            'fill-extrusion-height': 0.75,
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.6,
          },
        },
      },
      {
        source: {
          id: 'cars-point-data',
          type: 'geojson',
          data: carsJson,
        },
        layer: {
          id: 'cars-point',
          type: 'circle',
          maxzoom: 17,
          paint: {
            'circle-radius': 2,
            'circle-stroke-color': 'red',
            'circle-color': 'white',
            'circle-stroke-width': 1,
          },
        },
      },
      {
        source: {
          id: 'lines-data',
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: roadFeatures,
          },
        },
        layer: {
          id: linesLayerId,
          type: 'line',
          // layout: {
          //   'line-join': 'round',
          //   'line-cap': 'round',
          // },
          paint: {
            // 'line-color': ['get', 'color'],
            'line-width': 0,
          },
        },
      },
      // {
      //   source: {
      //     id: 'road-vector-data',
      //     type: 'vector',
      //     tiles: ['https://cyberjapandata.gsi.go.jp/xyz/experimental_bvmap/{z}/{x}/{y}.pbf'],
      //   },
      //   layer: {
      //     id: 'road-vector',
      //     type: 'line',
      //     source: 'gsi-bvmap',
      //     'source-layer': 'road',
      //     paint: {
      //       'line-color': '#900',
      //       'line-width': 3,
      //     },
      //   },
      // },
    ],
    [peopleJson]
  )

  useEffect(() => {
    const velocityPerMS = {
      walker: 4000 / 3600 / 1000,
      car: 60000 / 3600 / 1000,
    }
    let cancelId = 0
    const fn = () => {
      if (!mapObj) return

      const now = Date.now()
      const features = mapObj.queryRenderedFeatures(undefined, {
        layers: [linesLayerId],
      }) as unknown as RoadFeature[]
      const totalDistance = features.reduce((dis, f) => dis + f.properties.distance, 0)
      const step = [...Array(6)].reduce<number>(
        (result, _, n) => (result > 0 ? result : totalDistance / 10 ** n < 2000 ? 10 ** n : 0),
        0
      )
      const zoom = mapObj.getZoom()

      setPeopleJson({
        type: 'FeatureCollection',
        features: features.flatMap((road) => {
          const remain = road.properties.distanceFrom % step
          const list: Feature<Geometry, Properties>[] = []
          let n = 0
          while (road.properties.distanceFrom + step * n - remain < road.properties.distanceTo) {
            const startPoint = {
              lon: road.geometry.coordinates[0][0],
              lat: road.geometry.coordinates[0][1],
            }
            const point1 = computeDestinationPoint(
              computeDestinationPoint(
                startPoint,
                (step * n - remain + velocityPerMS.walker * now) % road.properties.distance,
                road.properties.bearing
              ),
              Math.sin(n) / 1.25 + 2.75,
              road.properties.bearing + 90 * (n % 2 ? 1 : -1)
            )

            const point2 = computeDestinationPoint(
              computeDestinationPoint(
                startPoint,
                (step * n - remain + velocityPerMS.walker * (10000000000000 - now)) %
                  road.properties.distance,
                road.properties.bearing
              ),
              Math.sin(n) / 1.75 + 2.5,
              road.properties.bearing - 90 * (n % 2 ? 1 : -1)
            )

            list.push(
              ...[point1, point2].map((p) =>
                zoom >= 17
                  ? polygon([
                      [...Array(20 + 1)]
                        .map((_, i) => computeDestinationPoint(p, 0.2, (360 / 20) * (i % 20)))
                        .map(({ longitude, latitude }) => [longitude, latitude]),
                    ])
                  : {
                      type: 'Feature' as const,
                      properties: {},
                      geometry: { type: 'Point' as const, coordinates: [p.longitude, p.latitude] },
                    }
              )
            )
            n += 1
          }

          return list
        }),
      })

      const carsStep = step * 20
      setCarsJson({
        type: 'FeatureCollection',
        features: features.flatMap((road) => {
          const remain = road.properties.distanceFrom % carsStep
          const list: Feature<Geometry, Properties>[] = []
          let n = 0
          while (
            road.properties.distanceFrom + carsStep * n - remain <
            road.properties.distanceTo
          ) {
            const startPoint = {
              lon: road.geometry.coordinates[0][0],
              lat: road.geometry.coordinates[0][1],
            }
            const point1 = computeDestinationPoint(
              computeDestinationPoint(
                startPoint,
                (carsStep * n - remain + velocityPerMS.car * now) % road.properties.distance,
                road.properties.bearing
              ),
              0.75,
              road.properties.bearing - 90
            )

            const point2 = computeDestinationPoint(
              computeDestinationPoint(
                startPoint,
                (carsStep * n - remain + velocityPerMS.car * (10000000000000 - now)) %
                  road.properties.distance,
                road.properties.bearing
              ),
              0.75,
              road.properties.bearing + 90
            )

            list.push(
              ...[point1, point2].map((p) =>
                zoom >= 17
                  ? transformRotate(
                      polygon([
                        [30, 150, 210, 330, 30]
                          .map((r) => computeDestinationPoint(p, 1, r))
                          .map(({ longitude, latitude }) => [longitude, latitude]),
                      ]),
                      road.properties.bearing
                    )
                  : {
                      type: 'Feature' as const,
                      properties: {},
                      geometry: { type: 'Point' as const, coordinates: [p.longitude, p.latitude] },
                    }
              )
            )
            n += 1
          }

          return list
        }),
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
        {sourceLayers.map(({ source, layer }) => (
          <Source key={source.id} {...source}>
            <Layer {...layer} />
          </Source>
        ))}
      </ReactMapGL>
    </DeckGL>
  )
}
