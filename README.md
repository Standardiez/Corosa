CONTRIBUTED AS: Stan8224

=== PROJECT OVERVIEW ===
A web-based carpooling platform that connects Passengers (Clients) seeking rides with Car Owners (Providers) offering available seats. Assume that the app will be limited to the Maryheights Campus. The app would be similar to Grab but instead allow students or faculty with cars to allow carpooling while clients can book to be a passenger. The modules will include the Clients (book a ride), Car Owners (providers), Admin (view dashboard and perform user management).

=== ENVIRONMENT REQUIREMENTS ===
- Operating System: Windows 10, Windows 11
- Web Server: Docker, Node.js
- Database: MySQL
- PHP Version: 8.3+
- Node.js Modules: mysql2, express, cors, multer
- Optional Tool: Redis

=== INSTRUCTIONS ===
1. Install the dependencies listed above (Node.js modules)
	- npm install [package-name]

2. Ensure that there is a Dockerfile.apache, Dockerfile.nodejs, and compose.yaml in the root folder as these will be referenced to run the containers.

3. Open a terminal inside Visual Studio Code and type the following code (NOTE: Disable WAMP Server before running this command):
	- docker compose up --build -d

4. Check the host machine's IP Address by opening a Command Prompt and enter the following code:
	- ipconfig

5. In host machine, open the web page by entering "localhost:8080" or directly open it inside the Docker UI.

6. In the client machine, type the following to access the web page:
	- [ip.address]:8080

7. To shutdown the server, run the following command inside the same terminal of the Visual Studio Code that executed the docker:
	- docker compose down

=== ADDITIONAL COMMANDS ===
1. To access the database, use the built-in command of docker
	- docker exec -it corosa_mysql mysql -u corosa_user -p
	- Enter password: corosa_password
	- use corosa_db
	- SHOW tables;
	- SELECT * FROM [table_name]

2. If any of the nodes are not running, check what is using the ports. Check the codes below to find what port is being used (3306 is used as an example):

	netstat -ano | findstr :3306
	sc query type= service | findstr /I mysql
	net stop wampmysqld64

=== SUBMITTED BY ===
TEAM HORTONS | 9467
- DelMendo, Renee Nathalie Aprille
- Mendoza, Nouel Benedict
- Nito, Kurt
- Redolme, Tristan
- Valdez, Steven Joe
- Viaje, Jenn
