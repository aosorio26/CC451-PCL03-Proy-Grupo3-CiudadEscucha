import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decodeAddress} from '../server/geocoding.js';
test('dirección cartográfica usa distrito reconocido y no adivina un suburbio desconocido',()=>{assert.deepEqual(decodeAddress({address:{road:'Avenida Perú',house_number:'20',suburb:'Los Olivos',city:'Lima'}}),{address:'Avenida Perú 20',district:'Los Olivos',source:'OpenStreetMap',attribution:'© OpenStreetMap contributors'});assert.equal(decodeAddress({address:{suburb:'Desconocido',city:'Lima'}}).district,null);assert.equal(decodeAddress({address:{suburb:'Santiago de Surco'}}).district,'Surco');});
