# Installation de Maven

Maven est requis pour démarrer les services Spring Boot.

## Option 1: Installation avec Chocolatey (Recommandé)

**Exécutez PowerShell en tant qu'Administrateur**, puis:

```powershell
choco install maven -y
```

Après l'installation, **fermez et rouvrez** votre terminal pour que les changements de PATH prennent effet.

## Option 2: Installation manuelle

1. **Téléchargez Maven:**
   - Allez sur: https://maven.apache.org/download.cgi
   - Téléchargez le fichier `apache-maven-3.9.x-bin.zip` (version la plus récente)

2. **Extrayez Maven:**
   - Extrayez le fichier ZIP dans `C:\Program Files\Apache\maven`
   - Vous devriez avoir: `C:\Program Files\Apache\maven\bin\mvn.cmd`

3. **Ajoutez Maven au PATH:**
   - Appuyez sur `Win + X` et sélectionnez "Système"
   - Cliquez sur "Paramètres système avancés"
   - Cliquez sur "Variables d'environnement"
   - Sous "Variables système", trouvez "Path" et cliquez sur "Modifier"
   - Cliquez sur "Nouveau" et ajoutez: `C:\Program Files\Apache\maven\bin`
   - Cliquez sur "OK" pour fermer toutes les fenêtres

4. **Vérifiez l'installation:**
   - Fermez et rouvrez votre terminal
   - Exécutez: `mvn --version`
   - Vous devriez voir la version de Maven

## Vérification

Après l'installation, vérifiez que Maven fonctionne:

```powershell
mvn --version
```

Vous devriez voir quelque chose comme:
```
Apache Maven 3.9.x
Maven home: C:\Program Files\Apache\maven
Java version: 21.x.x
```

Une fois Maven installé, vous pouvez utiliser les scripts de démarrage:
- `start-all-services.ps1` - Démarre tous les services
- `start-discovery-server.ps1` - Démarre uniquement Eureka
- `start-user-service.ps1` - Démarre uniquement le User Service
- `start-api-gateway.ps1` - Démarre uniquement l'API Gateway



