# DEAD COUNTY | Changelog

## v3.0 Performance & Art Rebuild (2026-10-18)

- Camadas de cenário e atores separadas em canvases persistentes, com overscan e deslocamento de câmera via transformações GPU.
- Não há reconstrução de tiles por frame. Os atores limpam somente retângulos alterados. Reconstrução do cenário ao superar o overscan ou mudar conteúdo/oclusão.
- Cache LRU de chunks e atlas de tiles em memória; sprites de personagens pré-renderizados por direção e animação.
- Colisão otimizada por índice espacial e campo de navegação atualizado periodicamente para hordas.
- Arte procedural expandida: asfalto texturizado, faixas, grama, árvores, caixotes isométricos, barris, placas, postes e acampamento de evacuação.
- Correções de toque no celular, reaparecimento confiável dos zumbis, pixels alinhados à densidade de tela e menos animações em repouso.
- Testes e métricas automáticas em GitHub Actions (Chromium desktop/mobile).

**Limite técnico:** objetos e personagens animados exigem atualização dos pixels que mudam. O cenário estático permanece em cache, mas é reconstruído quando é necessário mudar de região.



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
