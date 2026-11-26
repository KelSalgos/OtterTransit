# OtterTransit v0.4 🦦
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
- Recherche explicite d'arrêt, favoris par trajet et dernier trajet conservés localement (pas de serveur de stockage).
- Bus, trains, trams ou tous; sélection tactile de plusieurs lignes avec une destination indépendante (ou toutes) par ligne, parmi les 40 premiers départs demandés. Le tableau combine les lignes et trie par horaire de départ effectif. Le bouton Toutes retire les filtres de ligne ; une destination commune peut alors être choisie. Les sélections enregistrées restent disponibles si aucun départ ne correspond momentanément. Les anciens favoris d’arrêt et les trajets v0.2 sont migrés automatiquement. Nomme chaque trajet librement (Matin, Soir, Gottéron) ; plusieurs favoris sont possibles pour le même arrêt. Les deux sens se configurent séparément, sans calcul automatique du trajet inverse.
- Horaire Europe/Zurich, compte à rebours, quai si communiqué, retard et suppression si fournis.
- Actualisation toutes les 45 secondes lorsque visible; arrêt des demandes périodiques en arrière-plan. Une erreur conserve les dernières données en les signalant comme potentiellement périmées.
- Un horaire théorique n'est pas présenté comme une confirmation temps réel. L'API peut être incomplète, notamment pour les quais, les suppressions et les données TPF.
- Les recherches sont envoyées à transport.opendata.ch; aucune localisation GPS n'est demandée.

## API
https://transport.opendata.ch/docs.html — endpoints /locations, /stationboard et /connections. Données nationales : https://opentransportdata.swiss/.

## Tests
`node core.test.mjs` (Node.js facultatif). Tests unitaires sur timestamps, retard, quai modifié, suppression, filtre, compte à rebours. Tests unitaires supplémentaires : sélection multiple, destinations par ligne, tri, migration et clés de favoris. Le test navigateur a été bloqué par la politique réseau de l’environnement ; aucun test sur données TPF réelles pour cette version.

## Suite possible
Temps de marche configurable, mode maison/boulot, intégration OtterHub. Historique des retards seulement avec collecte serveur et respect des limites de l'API.

## v0.4 — Itinéraires
- Onglet indépendant : recherche de deux arrêts identifiés, inversion, départ immédiat ou date/heure de départ/arrivée (heure suisse), filtre transport, marge minimale de correspondance. Six connexions demandées (l’API peut en retourner davantage).
- Détail des étapes, marche, arrêts intermédiaires si fournis, heures estimées, retards, quais et suppressions si disponibles. Les marges calculées sont indicatives et ne garantissent pas la correspondance.
- Favoris d’itinéraires enregistrés localement, sans date/heure (ouvrent un départ immédiat). Favoris de départs existants conservés.
- Actualisation automatique des itinéraires toutes les 45 secondes lorsqu’ils sont visibles; les résultats d’une recherche immédiate peuvent évoluer.
- Tests : `node core.test.mjs` et `node journey.test.mjs`. Aucun déploiement automatique depuis cette archive.
