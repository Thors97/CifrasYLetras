#!/usr/bin/env node
// Genera diccionario/datos.js a partir de las listas de palabras en texto.
//
//   node scripts/generar-diccionario.js
//
// Entrada (una palabra por línea, UTF-8; las líneas vacías y las que empiezan por # se ignoran):
//   diccionario/palabras.txt   lista base
//   diccionario/añadidas.txt   palabras que se añaden a la base
//   diccionario/excluidas.txt  palabras que se quitan de la base
//
// Salida: diccionario/datos.js, que define window.DICCIONARIO con la lista ordenada,
// codificada por prefijos (cada línea empieza por un carácter '0'+n, donde n es el número
// de letras que comparte con la palabra anterior), comprimida con gzip y en base64.
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const DIR = path.join(__dirname, '..', 'diccionario');
const VALIDA = /^[a-zñáéíóúü]{5,10}$/;

function leer(nombre){
  const ruta = path.join(DIR, nombre);
  if (!fs.existsSync(ruta)) return [];
  const out = [];
  fs.readFileSync(ruta, 'utf8').split(/\r?\n/).forEach((ln, i) => {
    const w = ln.trim().normalize('NFC').toLowerCase();
    if (!w || w.startsWith('#')) return;
    if (!VALIDA.test(w)){ console.warn(`${nombre}:${i + 1}: se ignora «${ln.trim()}» (solo letras, de 5 a 10)`); return; }
    out.push(w);
  });
  return out;
}

const fuera = new Set(leer('excluidas.txt'));
const todas = new Set([...leer('palabras.txt'), ...leer('añadidas.txt')].filter(w => !fuera.has(w)));
const lista = [...todas].sort();

let prev = '', texto = '';
for (const w of lista){
  let k = 0;
  while (k < prev.length && k < w.length && prev[k] === w[k]) k++;
  texto += String.fromCharCode(48 + k) + w.slice(k) + '\n';
  prev = w;
}
const b64 = zlib.gzipSync(Buffer.from(texto, 'utf8'), { level: 9 }).toString('base64');
fs.writeFileSync(path.join(DIR, 'datos.js'),
  '// Generado por scripts/generar-diccionario.js a partir de diccionario/*.txt. No editar a mano.\n' +
  `window.DICCIONARIO = "${b64}";\n`);
console.log(`diccionario/datos.js: ${lista.length} palabras, ${Math.round(b64.length / 1024)} KB`);
