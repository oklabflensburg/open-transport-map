#!./venv/bin/python

import os
import click
import psycopg2
import csv

import gtfs_kit as gk

from dotenv import load_dotenv
from pathlib import Path


env_path = Path('..')/'.env'
load_dotenv(dotenv_path=env_path)


try:
    conn = psycopg2.connect(
        database = os.getenv('DB_NAME'),
        password = os.getenv('DB_PASS'),
        user = os.getenv('DB_USER'),
        host = os.getenv('DB_HOST'),
        port = os.getenv('DB_PORT')
    )   
    conn.autocommit = True
except Exception as e:
    print(e)


def create_dump(path):
    with open(path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, delimiter=',', quotechar='"', quoting=csv.QUOTE_ALL)
        writer.writerow(['agency_name', 'route_id', 'route_name', 'trip_id', 'dep_time', 'stop_id', 'stop_name', 'stop_lat', 'stop_lon'])


def write_dump(path, row):
    with open(path, 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, delimiter=',', quotechar='"', quoting=csv.QUOTE_ALL)
        writer.writerow(row)


@click.command()
@click.argument('file')
@click.argument('agency')
def main(file, agency):
    create_dump('dump.csv')

    path = Path(file)
    feed = (gk.read_feed(path, dist_units='km'))
    a_res = feed.agency.loc[(feed.agency['agency_name'] == agency)]
    a = a_res.to_dict(orient='records')
    # print(a[0]['agency_name'])


    for r_row in a:
        r_res = feed.routes.loc[(feed.routes['agency_id'] == r_row['agency_id'])]
        r = r_res.to_dict(orient='records')
        # print(r)

        for r_idx, rr in enumerate(r):
            # print(rr['route_id'])

            t_res = feed.trips.loc[(feed.trips['route_id'] == rr['route_id'])]
            t = t_res.to_dict(orient='records')
            # print(t)

            for t_idx, tt in enumerate(t):
                # print(tt['route_id'])
                # print(tt['trip_id'])

                st_res = feed.stop_times.loc[(feed.stop_times['trip_id'] == tt['trip_id'])]

                st_res = feed.stop_times.loc[(feed.stop_times['trip_id'] == tt['trip_id'])]
                st = st_res.to_dict(orient='records')
                # print(st)

                for st_idx, stst in enumerate(st):
                    # print(stst['departure_time'])

                    s_res = feed.stops.loc[(feed.stops['stop_id'] == stst['stop_id'])]
                    s = s_res.to_dict(orient='records')
                    # print(s)

                    for s_idx, ss in enumerate(s):
                        row = {
                            'agency_name': a[0]['agency_name'],
                            'route_id': rr['route_id'],
                            'route_name': rr['route_short_name'],
                            'trip_id': tt['trip_id'],
                            'dep_time': stst['departure_time'],
                            'stop_id': ss['stop_id'],
                            'stop_name': ss['stop_name'],
                            'stop_lat': ss['stop_lat'],
                            'stop_lon': ss['stop_lon']
                        }

                        write_dump('dump.csv', list(row.values()))


if __name__ == '__main__':
    main()