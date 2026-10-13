#!/usr/bin/env python3
"""Offline import. Requires pyshp 3.1.6 and Shapely 2.2.0; see docs/ward-boundaries.md."""
from pathlib import Path
import json,argparse,hashlib
import shapefile
from shapely.geometry import shape,mapping
from shapely import coverage_is_valid,coverage_simplify,set_precision
parser=argparse.ArgumentParser(description='Reproduce the pinned, display-only municipal and ward GeoJSON snapshot.')
parser.add_argument('input_dir', type=Path, help='Directory containing the eight source shapefile components')
parser.add_argument('--output-dir', type=Path, default=Path(__file__).resolve().parents[1]/'public'/'data')
parser.add_argument('--metadata', type=Path, default=Path(__file__).resolve().parents[1]/'public'/'data'/'wards.metadata.json')
args=parser.parse_args();raw=args.input_dir;out=args.output_dir
metadata=json.loads(args.metadata.read_text())
for item in metadata['sourcefiles']:
    data=(raw/item['file']).read_bytes()
    assert len(data)==item['bytes'] and hashlib.sha256(data).hexdigest()==item['sha256'], f"Source integrity mismatch: {item['file']}"
out.mkdir(parents=True,exist_ok=True);(out/'wards').mkdir(exist_ok=True)
province_codes={'Eastern Cape':'EC','Free State':'FS','Gauteng':'GT','KwaZulu-Natal':'KZN','Limpopo':'LIM','Mpumalanga':'MP','North West':'NW','Northern Cape':'NC','Western Cape':'WC'}
province_names={'EC':'Eastern Cape','FS':'Free State','GP':'Gauteng','GT':'Gauteng','KZN':'KwaZulu-Natal','LP':'Limpopo','LIM':'Limpopo','MP':'Mpumalanga','NW':'North West','NC':'Northern Cape','WC':'Western Cape'}
def rounded_coords(value):
 if isinstance(value,(list,tuple)):return [rounded_coords(v) for v in value]
 return round(value,6)
def convert(filename,kind):
 r=shapefile.Reader(raw/(filename+'.shp')); fields=[f[0] for f in r.fields[1:]];props=[];geoms=[]
 for s in r.iterShapeRecords():
  d=dict(zip(fields,s.record));g=shape(s.shape.__geo_interface__);assert g.is_valid and not g.is_empty and g.geom_type in ['Polygon','MultiPolygon'];geoms.append(g)
  if kind=='ward':
   name=d['Municipali'].split(' - ',1)[-1].strip();p={'wardId':str(d['pklWardId']),'wardNumber':int(d['WardNo']),'municipalityCode':d['MunicCode'],'municipalityName':name,'province':d['Province']}
  else:p={'code':d['MunicCode2'],'name':d['Munic2026'].split(' - ',1)[-1].strip(),'province':province_names[d['PROVINCE']]}
  props.append(p)
 print(filename,'loaded',len(geoms),'features',flush=True)
 is_coverage=bool(coverage_is_valid(geoms));print(filename,'validCoverage',is_coverage,flush=True)
 if is_coverage:
  # Simplify shared edges once so adjacent features continue to share the same vertices.
  simple=coverage_simplify(geoms,0.0001)
 else:simple=[g.simplify(0.0001,preserve_topology=True) for g in geoms]
 features=[]
 for p,g in zip(props,simple):
  # Snap the final geometry to 6 decimals with topology preservation, then check it.
  g=set_precision(g,0.000001);assert g.is_valid and not g.is_empty and g.geom_type in ['Polygon','MultiPolygon']
  geometry=dict(mapping(g));geometry['coordinates']=rounded_coords(geometry['coordinates']);assert shape(geometry).is_valid
  feat={'type':'Feature','id':p['wardId'] if kind=='ward' else p['code'],'properties':p,'geometry':geometry};features.append(feat)
 return features,is_coverage
wards,wcoverage=convert('Wards_2026','ward');municipalities,mcoverage=convert('Local_Municipalities_2026','municipal')
assert len(wards)==4485 and len(municipalities)==213
assert len(set(f['properties']['wardId'] for f in wards))==4485
assert set(f['properties']['municipalityCode'] for f in wards)==set(f['properties']['code'] for f in municipalities)
def write(path,features):
 path.write_text(json.dumps({'type':'FeatureCollection','features':features},separators=(',',':'),ensure_ascii=False)+'\n');print(path.name,len(features),path.stat().st_size,'bytes',flush=True)
for name,code in province_codes.items():write(out/'wards'/(code+'.geojson'),[f for f in wards if f['properties']['province']==name])
write(out/'municipal-boundaries.geojson',municipalities)
for item in metadata['displayFiles']:
    path=out/item['path'].removeprefix('/data/')
    data=path.read_bytes()
    assert len(data)==item['bytes'] and hashlib.sha256(data).hexdigest()==item['sha256'], f"Display integrity mismatch: {item['path']}"
print('Reproduced and verified all ten display files.', flush=True)
