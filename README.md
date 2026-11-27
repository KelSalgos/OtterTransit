# OtterTransit v0.8.1 🦦
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


## v0.5 — Radar et horizon de départs
- Seuls les départs effectifs entre maintenant et +35 minutes inclus sont affichés. Le filtrage se recalcule chaque seconde; les courses passées disparaissent. Les options de ligne/direction continuent d'utiliser les 40 départs obtenus de l'API, même au-delà de 35 min. Les itinéraires ne sont pas limités à 35 min.
- Nouvel onglet Radar : intégration de la carte externe https://transport.opendata.ch/examples/map.html dans une iframe, chargée uniquement quand l'onglet est ouvert, retirée en quittant l'onglet ou lorsque la page est masquée. Le lien externe reste disponible si le fournisseur bloque l'intégration. Ce n'est pas une carte native OtterTransit, elle a ses propres contrôles et ne reprend pas automatiquement les favoris ni les filtres locaux. Les positions sont estimées, pas des coordonnées GPS de véhicules. Aucun accès à la localisation de l'utilisateur demandé par OtterTransit.
- Carte externe : fonctionnement réel et permission d'intégration non vérifiés depuis cet environnement sans accès réseau. Tests unitaires de l'horizon et syntaxe JS vérifiés localement. Aucun déploiement.

## v0.6 — Radar natif
Carte Leaflet sans iframe, tuiles swisstopo, arrêts et véhicules estimés via /v2/map/stations, /vehicles et /trip. Filtres par type et nom/numéro de ligne (plusieurs séparés par virgules), recherche et centrage sur l'arrêt du tableau, détails des arrêts et courses, plein écran selon navigateur. Le radar interroge les véhicules toutes les 15 s et interpole toutes les secondes, uniquement en vue active; les positions ne sont pas du GPS. Les destinations du tableau ne sont pas automatiquement appliquées au radar (le segment fournit le prochain arrêt, pas le terminus). Les bus peuvent être représentés en ligne droite. En cas d'échec les positions sont masquées, la carte originale reste accessible. Les favoris restent locaux et les départs limités à 35 min. Tests purs : node radar.test.mjs. Les appels réseau et le rendu réel sont à vérifier sur GitHub Pages; Leaflet et les tuiles nécessitent Internet. Voir THIRD_PARTY_NOTICES.md.

## v0.7 — Lignes autorisées dans les itinéraires
La recherche demande jusqu'à 16 itinéraires à l'API. Les lignes détectées dans les résultats sont proposées sous forme de boutons multisélection. Toutes désactive le filtre. Une sélection impose que chaque trajet motorisé utilise une ligne choisie (catégorie + numéro, comme B 2) ; la marche reste autorisée. Ce filtre local ne force pas le calculateur distant à inventer des alternatives et ne couvre que les itinéraires reçus. Les lignes choisies restent disponibles pendant l'actualisation, même si elles disparaissent des résultats. Les favoris mémorisent leur propre liste de lignes, y compris après rechargement, et les anciens favoris restent compatibles (toutes les lignes). Les variantes de lignes peuvent être enregistrées séparément pour le même trajet. Pas de modification du radar ni du tableau des départs. Tests : node journey.test.mjs.

## v0.8 — OtterAlert (expérimental)
Trafic TPF : GitHub Actions collecte la section des perturbations en cours de la page officielle toutes les dix minutes, au mieux, puis publie un JSON factuel dans la branche isolée traffic-data. Le site existant reste sur GitHub Pages, sans changement de mode de déploiement, sans clé API ni nouveau serveur. Le navigateur lit le JSON public via raw.githubusercontent.com toutes les deux minutes (cache et planification non garantis). En cas d'échec ou d'état inconnu, aucun trajet n'est marqué touché; les associations sont désactivées au-delà de 30 minutes. Le rapprochement utilise l'opérateur TPF, la ligne explicitement citée, et un intervalle proche de maintenant (35 minutes) faute de période structurée. Il indique une perturbation potentielle et n'infère ni suppression, ni direction, ni arrêt non desservi. Les travaux futurs ne sont pas couverts et restent accessibles sur le lien TPF. Les favoris et horaires restent inchangés. Le collecteur HTML est expérimental, dépend de la structure et disponibilité du site, et doit être vérifié sur les vrais résultats et selon les conditions de réutilisation du fournisseur. Seuls des identifiants factuels et une catégorie générique sont republiés, pas les textes ou images des annonces. Tests locaux de logique : node alerts.test.mjs. Le workflow peut nécessiter une autorisation Actions (contents: write).

## v0.8.1 — Périodes des perturbations
Extraction expérimentale de périodes horaires le jour suisse de collecte (14h00 à 19h00, 14:00 – 19:00) et fins seules (jusqu’à 19:00 environ). Séparation des annonces par dernière mise à jour lorsque disponible. Une période complète limite les associations à son intervalle, fin exclue; une fin seule limite les associations aux trajets proches/à venir avant cette fin. En l'absence de période interprétable, le comportement prudent de v0.8 reste en place. Dates sur plusieurs jours, horaires nocturnes ambigus et travaux futurs ne sont pas déduits. La première collecte v0.8 a réussi sur le site réel en état sans perturbation; l'extraction de périodes actives reste à valider sur des annonces réelles. Tests sur exemples synthétiques et formulations observées.

## v0.9 — OtterAlert 48H
Collecte prévue toutes les 15 minutes via GitHub Actions (sans garantie de ponctualité). Les annonces structurées Du/Au sont extraites, dédoublonnées et affichées si elles chevauchent les 48 prochaines heures. Les plages nocturnes quotidiennes explicites sont calculées séparément; les restrictions complexes non interprétables restent informatives sans association aux trajets. Un rendu Chromium de secours tente de lire les fiches si le HTML brut ne les expose pas. Si indisponibles, l'interface indique que la collecte planifiée n'est pas confirmée. Aucun serveur ni modification de l'hébergement. Le rapprochement reste indicatif, par transporteur, ligne et intervalle. Le rendu du site réel et la couverture exhaustive des fiches restent à vérifier.
