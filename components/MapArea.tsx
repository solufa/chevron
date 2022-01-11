import DeckGL from '@deck.gl/react'
import { Feature, polygon, Properties, transformRotate } from '@turf/turf'
import { FeatureCollection, Geometry } from 'geojson'
import { computeDestinationPoint } from 'geolib'
import { Map } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useMemo, useState } from 'react'
import ReactMapGL, { Layer, LayerProps, Source, SourceProps, ViewportProps } from 'react-map-gl'
import { RoadFeature } from '../types/json'

// eslint-disable-next-line
const roadFeatures: RoadFeature[] = require('../tasks/road.json')
const minzoom = 17

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
          id: 'cars-shadow-data',
          type: 'geojson',
          data: carsShadowJson,
        },
        layer: {
          id: 'cars-shadow',
          type: 'fill-extrusion',
          minzoom,
          paint: {
            'fill-extrusion-color': '#888',
            'fill-extrusion-height': 0,
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
          minzoom,
          paint: {
            'fill-extrusion-color': 'red',
            'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], minzoom, 3, 20, 0.75],
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
        source: {
          id: 'people-shadow-data',
          type: 'geojson',
          data: peopleShadowJson,
        },
        layer: {
          id: 'people-shadow',
          type: 'fill-extrusion',
          minzoom: minzoom,
          paint: {
            'fill-extrusion-color': '#888',
            'fill-extrusion-height': 0,
          },
        },
      },
      {
        source: {
          id: 'people-data',
          type: 'geojson',
          data: peopleJson,
        },
        layer: {
          id: 'people',
          type: 'fill-extrusion',
          minzoom,
          paint: {
            'fill-extrusion-color': '#0084ff',
            'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], minzoom, 3, 20, 0.75],
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
          maxzoom: minzoom,
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
      car: 40000 / 3600 / 1000,
    }
    let cancelId = 0
    const fn = () => {
      if (!mapObj) return

      const now = Date.now()
      const features = mapObj.queryRenderedFeatures(undefined, {
        layers: [linesLayerId],
      }) as unknown as RoadFeature[]
      const totalDistance = features.reduce((dis, f) => dis + f.properties.distance, 0)
      const step = Math.max(1, Math.floor(totalDistance / 2000))
      const zoom = mapObj.getZoom()
      // const scale = zoom >= minzoom ? (1 / 2) ** mapObj.getZoom() * 2 ** 20 : 5
      const scale = zoom >= minzoom ? 2 : 4
      const list1 = features.map((road) => {
        const remain = road.properties.distanceFrom % step
        const peopleList: Feature<Geometry, Properties>[] = []
        const shadowList: Feature<Geometry, Properties>[] = []
        const posList = [
          [0.25, 0],
          [0.25, 90],
          [Math.sqrt(2) * 0.25, 135],
          [0, 0],
          [Math.sqrt(2) * 0.25, 225],
          [0.25, 270],
          [0.25, 0],
        ]
        let n = 0
        while (road.properties.distanceFrom + step * n - remain < road.properties.distanceTo) {
          const point1 = computeDestinationPoint(
            computeDestinationPoint(
              [road.properties.lonStart, road.properties.latStart], // road.geometry.coordinates[0] を使うとずれる
              (step * n - remain + velocityPerMS.walker * now) % road.properties.distance,
              road.properties.bearing
            ),
            (Math.sin(n + 1) + 3.2) * scale,
            road.properties.bearing + 90 * (n % 2 ? 1 : -1)
          )
          const point2 = computeDestinationPoint(
            computeDestinationPoint(
              [road.properties.lonStart, road.properties.latStart],
              (step * n - remain + velocityPerMS.walker * (10000000000000 - now)) %
                road.properties.distance,
              road.properties.bearing
            ),
            (Math.sin(n) + 3.3) * scale,
            road.properties.bearing - 90 * (n % 2 ? 1 : -1)
          )

          peopleList.push(
            ...[point1, point2].map((p, i) =>
              zoom >= minzoom
                ? transformRotate(
                    polygon([
                      posList
                        .map(([d, r]) => computeDestinationPoint(p, d * scale, r))
                        .map(({ longitude, latitude }) => [longitude, latitude]),
                    ]),
                    road.properties.bearing + (i % 2 ? 180 : 0)
                  )
                : {
                    type: 'Feature' as const,
                    properties: {},
                    geometry: { type: 'Point' as const, coordinates: [p.longitude, p.latitude] },
                  }
            )
          )

          if (zoom >= minzoom) {
            shadowList.push(
              ...[point1, point2].map((p, i) =>
                transformRotate(
                  polygon([
                    posList
                      .map(([d, r]) => computeDestinationPoint(p, d * scale * 1.5, r))
                      .map(({ longitude, latitude }) => [longitude, latitude]),
                  ]),
                  road.properties.bearing + (i % 2 ? 180 : 0)
                )
              )
            )
          }
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
      const list2 = features.map((road) => {
        const remain = road.properties.distanceFrom % carsStep
        const carsList: Feature<Geometry, Properties>[] = []
        const shadowList: Feature<Geometry, Properties>[] = []
        const posList = [
          [0.5, 0],
          [0.5, 90],
          [1, 150],
          [0.5, 180],
          [1, 210],
          [0.5, 270],
          [0.5, 0],
        ]
        let n = 0
        while (road.properties.distanceFrom + carsStep * n - remain < road.properties.distanceTo) {
          const point1 = computeDestinationPoint(
            computeDestinationPoint(
              [road.properties.lonStart, road.properties.latStart],
              (carsStep * n - remain + velocityPerMS.car * now) % road.properties.distance,
              road.properties.bearing
            ),
            0.75 * scale,
            road.properties.bearing - 90
          )

          const point2 = computeDestinationPoint(
            computeDestinationPoint(
              [road.properties.lonStart, road.properties.latStart],
              (carsStep * n - remain + velocityPerMS.car * (10000000000000 - now)) %
                road.properties.distance,
              road.properties.bearing
            ),
            0.75 * scale,
            road.properties.bearing + 90
          )

          carsList.push(
            ...[point1, point2].map((p, i) =>
              zoom >= minzoom
                ? transformRotate(
                    polygon([
                      posList
                        .map(([d, r]) => computeDestinationPoint(p, d * scale, r))
                        .map(({ longitude, latitude }) => [longitude, latitude]),
                    ]),
                    road.properties.bearing + (i % 2 ? 180 : 0)
                  )
                : {
                    type: 'Feature' as const,
                    properties: {},
                    geometry: { type: 'Point' as const, coordinates: [p.longitude, p.latitude] },
                  }
            )
          )

          if (zoom >= minzoom) {
            shadowList.push(
              ...[point1, point2].map((p, i) =>
                transformRotate(
                  polygon([
                    posList
                      .map(([d, r]) => computeDestinationPoint(p, d * scale * 1.25, r))
                      .map(({ longitude, latitude }) => [longitude, latitude]),
                  ]),
                  road.properties.bearing + (i % 2 ? 180 : 0)
                )
              )
            )
          }

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
        {sourceLayers.map(({ source, layer }) => (
          <Source key={source.id} {...source}>
            <Layer {...layer} />
          </Source>
        ))}
      </ReactMapGL>
    </DeckGL>
  )
}
