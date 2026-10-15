# Passo Firme

Aplicativo Android de incentivo e autocuidado para homens, em português. Feito com React Native, Expo e TypeScript.

## Primeira versão

- Mensagem do dia com uma pequena ação de autocuidado; 14 mensagens incluídas.
- Biblioteca de mensagens e favoritos salvos no aparelho.
- Compartilhamento pelo Android.
- Lembretes locais no horário escolhido, com sete mensagens que se repetem semanalmente.
- Teste de notificação em cinco segundos; tocar no lembrete abre a mensagem correspondente.
- Sem cadastro, servidor, anúncios ou chave de API. Favoritos e preferências usam armazenamento local; desinstalar o app apaga esses dados. O compartilhamento usa os aplicativos escolhidos pelo usuário.

O conteúdo oferece incentivo e não substitui atendimento psicológico ou médico. O app inclui acesso ao CVV (188) e orientação de emergência no Brasil (192).

## Desenvolvimento

Requer Node.js 22.13+ (Node 24 recomendado), npm e Android físico ou emulador. Use o checkout existente; cada tarefa na nuvem já é isolada e não precisa de um Git worktree.

```sh
npm ci
npm start
```

Abra no Expo Go compatível com o SDK 57 para explorar a interface. Para validar notificações e o comportamento real no Android, use uma compilação de desenvolvimento ou o APK abaixo; o funcionamento em Expo Go pode variar.

```sh
npm run typecheck
npm test
npm run export:android
```

A exportação valida e gera o pacote JavaScript/assets Android em `dist/`; **não gera um APK**. Os testes automatizados verificam rotação das mensagens, agendamento, recusa de permissão e recuperação de falhas com o módulo nativo simulado.

## Gerar APK instalável

Com uma conta Expo e acesso ao serviço EAS:

```sh
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

Na primeira execução, vincule o projeto à sua conta e configure a assinatura pelo fluxo do EAS. O perfil `preview` gera um APK para instalação manual; `production` gera um AAB para a Play Store. Nunca versione credenciais de assinatura. A publicação na loja exige conta de desenvolvedor, revisão e materiais próprios.

Alternativa local: `npx expo run:android` com JDK e Android SDK compatíveis instalados. Esta opção gera a pasta nativa Android localmente.

## Conferência no aparelho

1. Abra o app e confira a mensagem do dia, a biblioteca e o compartilhamento.
2. Favorite uma mensagem, feche e reabra o app; confira a persistência.
3. Em Lembretes, permita notificações e use o teste de cinco segundos.
4. Salve um horário próximo e confira o lembrete com o app em segundo plano; toque nele para abrir a mensagem.
5. Desative os lembretes e confira que não voltam a ser entregues. Teste também a recusa de permissão e reativação nas configurações do Android.
6. Teste após reiniciar o aparelho e com economia de bateria. O sistema pode atrasar notificações; após trocar de fuso horário, salve novamente o horário.

## Ambiente na nuvem

Não é necessário banco de dados ou segredo para executar os testes e gerar o pacote JavaScript. Se o diretório padrão de cache do npm não puder ser escrito, use `npm_config_cache=/tmp/appteste-npm`. Neste ambiente, o Expo também precisa de `__UNSAFE_EXPO_HOME_DIRECTORY=/workspace/.passofirme-expo` e `XDG_CACHE_HOME=/tmp/passofirme-cache` exportados no shell para gravar suas configurações e caches fora da pasta pessoal somente leitura; não coloque credenciais no repositório. Em rede restrita, os comandos Expo podem usar `EXPO_OFFLINE=1 EXPO_NO_TELEMETRY=1 EXPO_NO_CACHE=1` para trabalhar com os metadados e dependências já instalados. Isso não gera APK e não elimina a necessidade de acesso ao npm para instalar pacotes.
