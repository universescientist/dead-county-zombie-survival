# DEAD COUNTY | Changelog

## v2.0 Isometric Overhaul (2026-10-18)

- Cenário projetado em losangos 2:1 com transformações world-to-screen e inversa.
- Câmera centralizada no personagem em coordenadas isométricas.
- Movimento no plano da tela com WASD, setas e joystick.
- Mira convertida do espaço de tela para direção real do mundo.
- Profundidade em cenas: personagens, carros, árvores, torre, objetos, barricadas e telhados desenhados por ordem de profundidade.
- Paredes 3/4, fachadas, telhados com transparência de proximidade e interiores exploráveis.
- Móveis interiores com colisões e sprites isométricos.
- Cache LRU de 36 chunks para terrenos estáticos; apenas entidades dinâmicas redesenhadas em tempo real.
- Notificações reposicionadas para não cobrir controles touch, iluminação do amanhecer refinada.
- QA no Chromium desktop e viewport mobile, com verificações matemáticas da projeção, screenshot do cenário, inventário, zombies, crafting, salvar e missão.

## Limitações

Protótipo original independente, jogável no navegador. Não representa um título AAA comercial pronto. Não inclui multiplayer, física de veículos ou interiores completos com iluminação volumétrica.
