# OtterTransit v0.1 🦦
Page web statique, en français, pour les prochains départs en Suisse. Bus par défaut. Aucun compte ni clé API.

## Démarrer (Windows)
Extraire le ZIP, ouvrir un terminal dans le dossier `ottertransit`, puis :

```powershell
py -m http.server 8080 --bind 127.0.0.1
```
Ouvrir http://localhost:8080 dans le navigateur. Python 3 est nécessaire pour cette commande uniquement. Alternative : tout serveur web statique. Ne pas ouvrir index.html directement (modules JavaScript et PWA nécessitent HTTP).

## Téléphone / hébergement
Publier les fichiers sur un hébergement statique HTTPS (GitHub Pages, Cloudflare Pages, etc.). Sur Android, ouvrir l'URL dans Chrome, puis menu > Ajouter à l'écran d'accueil / Installer l'application si proposé. Le service worker met en cache l'interface, jamais les départs. Les données en direct nécessitent Internet. Aucun déploiement n'a été effectué.

## Fonctionnement
- Recherche explicite d'arrêt, favoris et dernier arrêt conservés localement (pas de serveur de stockage).
- Bus, trains, trams ou tous; filtre par numéro exact, destination ou opérateur parmi les 40 premiers départs demandés.
- Horaire Europe/Zurich, compte à rebours, quai si communiqué, retard et suppression si fournis.
- Actualisation toutes les 45 secondes lorsque visible; arrêt des demandes périodiques en arrière-plan. Une erreur conserve les dernières données en les signalant comme potentiellement périmées.
- Un horaire théorique n'est pas présenté comme une confirmation temps réel. L'API peut être incomplète, notamment pour les quais, les suppressions et les données TPF.
- Les recherches sont envoyées à transport.opendata.ch; aucune localisation GPS n'est demandée.

## API
https://transport.opendata.ch/docs.html — endpoints /locations et /stationboard. Données nationales : https://opentransportdata.swiss/.

## Tests
`node core.test.mjs` (Node.js facultatif). Tests unitaires sur timestamps, retard, quai modifié, suppression, filtre, compte à rebours. Aucun test navigateur ou réseau réel effectué dans l'environnement de création.

## Suite possible
Favoris par ligne/direction, temps de marche configurable, mode maison/boulot, intégration OtterHub. Historique des retards seulement avec collecte serveur et respect des limites de l'API.
