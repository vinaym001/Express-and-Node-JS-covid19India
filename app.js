const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dBPath = path.join(__dirname, "covid19India.db");

let db = null;
const initiazileDbAndServer = async () => {
  try {
    db = await open({
      filename: dBPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server is running on http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB ERROR:${e.message}`);
    process.exit(1);
  }
};
initiazileDbAndServer();

const cvtStateSnakeCaseToCamelCase = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
const cvtDistrictSnakeCaseToCamelCase = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getStateDetailsQuery = `SELECT * FROM state;`;
  const stateDetails = await db.all(getStateDetailsQuery);
  response.send(
    stateDetails.map((eachItem) => cvtStateSnakeCaseToCamelCase(eachItem))
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateIdDetailsQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const stateIdDetails = await db.get(getStateIdDetailsQuery);
  //   response.send(stateIdDetails);
  response.send(cvtStateSnakeCaseToCamelCase(stateIdDetails));
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const addDistrictDetailsQuery = `
    INSERT INTO
    district(
            district_name,
            state_id,
            cases,
            cured,
            active,
            deaths)
    VALUES( 
           '${districtName}',
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths});`;
  await db.run(addDistrictDetailsQuery);
  response.send("District Successfully Added ");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdDetailsQuery = `SELECT * FROM district WHERE district_id = ${districtId};`;
  const districtIdDetails = await db.get(getDistrictIdDetailsQuery);
  //   response.send(stateIdDetails);
  response.send(cvtDistrictSnakeCaseToCamelCase(districtIdDetails));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const removeDistrictIdDetailsQuery = `DELETE  FROM district WHERE district_id = ${districtId};`;
  await db.get(removeDistrictIdDetailsQuery);
  //   response.send(stateIdDetails);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
    UPDATE 
    district
    SET
        district_name = '${districtName}', 
        state_id = ${stateId}, 
        cases = ${cases}, 
        cured = ${cured}, 
        active = ${active}, 
        deaths= ${deaths}
    WHERE
         district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

app.get("/districts/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
    SELECT sum(cases) AS totalCases, sum(cured) AS totalCured, sum(active) AS totalActive, sum(deaths) AS totalDeaths FROM district WHERE state_id = ${stateId};`;
  const stats = await db.get(getStatsQuery);
  response.send(stats);
});
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateName = `
    SELECT state_id FROM district WHERE district_id = ${districtId};`;

  const StateId = await db.get(getStateName);
  const stateID = StateId.state_id;
  const stateName1 = `
  SELECT state_name FROM state WHERE state_id = ${stateID};`;
  const s = await db.get(stateName1);

  response.send(cvtStateSnakeCaseToCamelCase(s));
});
module.exports = app;
