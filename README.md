# Cycle Finance Engine

Aplicação de controle financeiro em React + Vite.

## Estado atual da persistência

A persistência remota/banco de dados foi removida para recomeçar do zero.
No momento, os dados são salvos apenas no `localStorage` do navegador.

## Observação sobre deploy

Também removemos o middleware Edge baseado em `next/server`, pois ele não é compatível com este projeto Vite e estava quebrando o build na Vercel.
