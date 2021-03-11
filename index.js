const mysql = require("mysql");
const inquirer = require("inquirer");
const consoleTalbe = require("console.table");

const connectionProperties = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "Please Enter your password for mysql in there !!!!!!",
  database: "employeesDB",
  multipleStatements: true
};

const connection = mysql.createConnection(connectionProperties);

connection.connect(err => {
  if (err) throw err
  startMain()
});

function startMain() {
  inquirer
    .prompt({
      name: "options",
      type: "list",
      message: "MAIN MENU",
      choices: [
        "view all roles",
        "view all departments",
        "view all employees",
        "view all employees by department",
        "view all employees by managers",
        "add employee",
        "remove employee",
        "add a role",
        "remove a role",
        "add a department",
        "remove a department",
        "update employee roles",
        "exit",
      ]
    })
    .then(answer => {
      switch (answer.options) {
        case "view all roles":
          viewAllRoles()
          break;

        case "view all departments":
          viewAllDepartments()
          break;

        case "view all employees":
          viewAllEmployees()
          break;

        case "view all employees by department":
          viewAllEmpByDept()
          break;

        case "view all employees by managers":
          viewAllEmpByManager()
          break;

        case "add employee":
          addEmployee()
          break;

        case "remove employee":
          reomveEmployee()
          break

        case "add a department":
          addDepartment()
          break;

        case "remove a department":
          removeDepartment()
          break;

        case "add a role":
          addRole()
          break;

        case "remove a role":
          removeRole()
          break;

        case "update employee roles":
          updateEmployRole()
          break;

        case "exit":
          console.log("Hit ctrl + C to exit prompt")
          break;
      }
    })
};

const viewAllRoles = () => {
  const queryRoles = `
  SELECT title, salary, d.name AS department
  FROM role r
  JOIN department d 
	  ON r.department_id = d.id;
  `;

  connection.query(queryRoles, (err, res) => {
    if (err) throw err;
    console.table(res);
    startMain();
  })
}

const viewAllDepartments = () => {
  const queryDepartments = `
  SELECT name
  FROM department;
  `

  connection.query(queryDepartments, (err, res) => {
    if (err) throw err;
    console.table(res)
    startMain();
  })
}

const viewAllEmployees = () => {
  const query = `
  SELECT e.id, 
	  e.first_name, 
    e.last_name, 
    r.title, 
    d.name AS department, 
    r.salary, 
    concat(m.first_name," ",m.last_name) AS manager
  FROM employee e
  LEFT JOIN role r 
	  ON e.role_id = r.id 
  LEFT JOIN department d
	  ON r.department_id = d.id
  LEFT JOIN employee m
	  ON e.manager_id = m.id;`

  connection.query(query, (err, res) => {
    if (err) throw err
    console.table(res);
    startMain();
  });
};

const viewAllEmpByDept = () => {
  const query = `SELECT name FROM department`;
  connection.query(query, async (err, res) => {
    if (err) throw err;
    await inquirer.prompt({
      name: "department",
      type: "list",
      message: "Which department would you like to search ?",
      choices: res.map(ele => ele.name)
    }).then(answer => {

      const query1 = `
      SELECT e.id, 
	      e.first_name, 
        e.last_name, 
        r.title, 
        d.name AS department, 
        r.salary, 
        concat(m.first_name," ",m.last_name) AS manager
      FROM employee e
      LEFT JOIN role r 
        ON e.role_id = r.id 
      LEFT JOIN department d
        ON r.department_id = d.id
      LEFT JOIN employee m
        ON e.manager_id = m.id
      WHERE d.name = "${answer.department}";`

      connection.query(query1, (err, res) => {
        if (err) throw err
        console.table(res)
        startMain();
      });
    })
  })
};

const viewAllEmpByManager = () => {
  const query = `
  SELECT concat(m.first_name," ",m.last_name) AS manager
  FROM employee e, employee m
  WHERE e.manager_id = m.id 
  GROUP BY manager
  ORDER BY manager ASC;`;

  connection.query(query, (err, res) => {
    if (err) throw err;

    inquirer.prompt({
      name: "manager",
      type: "list",
      message: "Which manager would you like to search ? ",
      choices: res.map(ele => ele.manager)
    }).then(answer => {
      const query1 = `
      SELECT e.id, 
	      e.first_name, 
        e.last_name, 
        r.title, 
        d.name AS department, 
        r.salary, 
        concat(m.first_name," ",m.last_name) AS manager
      FROM employee e
      LEFT JOIN role r 
        ON e.role_id = r.id 
      LEFT JOIN department d
        ON r.department_id = d.id
      LEFT JOIN employee m
        ON e.manager_id = m.id
      WHERE concat(m.first_name," ",m.last_name) = "${answer.manager}";`

      connection.query(query1, (err, res) => {
        if (err) throw err;
        console.table(res);
        startMain()
      })
    })
  })
};

const addEmployee = () => {

  const queryRole = `SELECT title FROM role;`;
  const queryManager = `
    SELECT concat(m.first_name," ",m.last_name) AS manager
    FROM employee e, employee m
    WHERE e.manager_id = m.id 
    GROUP BY manager
    ORDER BY manager ASC;`;

  const query = queryRole + queryManager;
  connection.query(query, (err, res) => {
    if (err) throw err;
    inquirer.prompt([
      {
        name: "firstName",
        type: "input",
        message: "First name: ",
        validate: function (input) {
          if (!input) {
            console.log("**FILED REQUIRED**")
            return false
          } else {
            return true
          }
        }
      },
      {
        name: "lastName",
        type: "input",
        message: "Last name: ",
        validate: function (input) {
          if (!input) {
            console.log("**FILED REQUIRED**")
            return false
          } else {
            return true
          }
        }
      },
      {
        name: "role",
        type: "list",
        message: "What is his/her role ?",
        choices: res[0].map(ele => ele.title)
      },
      {
        name: "e_manager",
        type: "list",
        message: "Who is his/her manager ?",
        choices: res[1].map(ele => ele.manager)
      }]
    ).then((ans) => {
      const queryRoleID = `SELECT id FROM role WHERE title = "${ans.role}";`;
      const queryManagerID = `
      SELECT e.manager_id, concat(m.first_name," ",m.last_name) AS manager
      FROM employee e, employee m
      WHERE e.manager_id = m.id and concat(m.first_name," ",m.last_name) = "${ans.e_manager}"
      GROUP BY e.manager_id;`
      const queryIDs = queryRoleID + queryManagerID;

      connection.query(queryIDs, (err, res) => {
        if (err) throw err;

        const queryAddEmp = `
        INSERT INTO employee (first_name, last_name, role_id, manager_id)
        VALUES ("${ans.firstName}", "${ans.lastName}", ${res[0][0].id}, ${res[1][0].manager_id});
        `
        connection.query(queryAddEmp, (err, res) => {
          if (err) throw err;
          startMain();
        })
      })
    });
  });

}

const reomveEmployee = () => {
  const queryEmp = `
  SELECT e.id,
	  e.first_name, 
    e.last_name, 
    r.title, 
    d.name AS department
  FROM employee e
  LEFT JOIN role r 
	  ON e.role_id = r.id 
  LEFT JOIN department d
	  ON r.department_id = d.id
  ORDER BY e.id;
  `

  connection.query(queryEmp, (err, res) => {
    if (err) throw err;

    inquirer.prompt(
      {
        name: "deleteEmp",
        type: "list",
        message: "Which employee is to be removed ?",
        choices: res.map(ele => `ID:${ele.id}  Name:${ele.first_name} ${ele.last_name}`)
      }
    ).then(ans => {
      const toDeleteID = parseInt(ans.deleteEmp.split(" ")[0].substring(3));
      const queryDeleteEmp = `DELETE FROM employee WHERE employee.id = ${toDeleteID};`
      connection.query(queryDeleteEmp, (err, res) => {
        if (err) throw err;
        console.log("Deleted");
        startMain();
      })
    })
  })
}

const addDepartment = () => {
  inquirer.prompt(
    {
      name: "newDepartment",
      type: "input",
      message: "What is the new department ?",
      validate: function (input) {
        if (!input) {
          console.log("**FILED REQUIRED**")
          return false
        } else {
          return true
        }
      }
    }).then(ans => {
      const queryAddDept = `
      INSERT INTO department (name)
      VALUES ("${ans.newDepartment}")
      `
      connection.query(queryAddDept, (err, res) => {
        if (err) throw err;
        startMain();
      })
    })
}

const removeDepartment = () => {
  const queryRemoveDept = `
  SELECT name FROM department;
  `;
  connection.query(queryRemoveDept, (err, res) => {
    if (err) throw err;

    inquirer.prompt({
      name: "removeDepartment",
      type: "list",
      message: "Which department is to be deleted ?",
      choices: res.map(ele => ele.name)
    }).then(ans => {
      const queryRemoveDept = `
      DELETE FROM department WHERE department.name = "${ans.removeDepartment}";
      `

      connection.query(queryRemoveDept, (err, res) => {
        if (err) throw err;
        console.log("Deleted")
        startMain();
      })
    })
  })
}

const addRole = () => {
  const queryDepartment = `SELECT id, name FROM department;`

  connection.query(queryDepartment, (err, res) => {
    if (err) throw err;

    inquirer.prompt([
      {
        name: "title",
        type: "input",
        message: "What new role to add ?",
      },
      {
        name: "salary",
        type: "input",
        message: "What is the salary for this role ?"
      },
      {
        name: "departmentName",
        type: "list",
        message: "Which department this role belongs to ?",
        choices: res.map(ele => ele.name)
      }
    ]).then(ans => {
      const queryFindDeptID = `
      SELECT id FROM department WHERE department.name ="${ans.departmentName}";
      `
      const title = ans.title;
      const salary = ans.salary;
      connection.query(queryFindDeptID, (err, res) => {
        if (err) throw err;

        const queryAddRole = `
        INSERT INTO role (title, salary, department_id)
        VALUES ("${title}",${salary},${res[0].id});
        `
        connection.query(queryAddRole, (err, res) => {
          if (err) throw err;

          console.log("Added a new role");
          startMain();
        })
      })

    })
  })
}

const removeRole = () => {
  const queryRoles = `SELECT title FROM role;`
  connection.query(queryRoles, (err, res) => {
    if (err) throw err;

    inquirer.prompt({
      name: "removeRole",
      type: "list",
      message: "Whick role to delete ?",
      choices: res.map(ele => ele.title)
    }).then(ans => {
      const queryRemoveRole = `
      DELETE FROM role WHERE role.title = "${ans.removeRole}";
      `;
      connection.query(queryRemoveRole, (err, res) => {
        if (err) throw err;
        console.log("Deleted");
        startMain();
      })
    })
  })
}

const updateEmployRole = () => {
  const queryEmployees = `
  SELECT e.id, 
	  e.first_name, 
    e.last_name, 
    r.title, 
    d.name AS department, 
    r.salary, 
    concat(m.first_name," ",m.last_name) AS manager
  FROM employee e
  LEFT JOIN role r 
	  ON e.role_id = r.id 
  LEFT JOIN department d
	  ON r.department_id = d.id
  LEFT JOIN employee m
	  ON e.manager_id = m.id;`

  connection.query(queryEmployees, (err, res) => {
    if (err) throw err;

    inquirer.prompt({
      name: "updateEmp",
      type: "list",
      message: "Which employee tp update ?",
      choices: res.map(ele => `ID:${ele.id}  Name:${ele.first_name} ${ele.last_name}`)
    })
      .then(ans => {
        const toUpdateID = parseInt(ans.updateEmp.split(" ")[0].substring(3));

        const queryRoles = 'SELECT title FROM role;'
        connection.query(queryRoles, (err, res) => {
          if (err) throw err;

          inquirer.prompt({
            name: "updateEmpRole",
            type: "list",
            message: "Which role this employee needs to update to ?",
            choices: res.map(ele => ele.title)
          }).then(ans => {
            const queryGetRoleID = `SELECT id FROM role WHERE role.title ="${ans.updateEmpRole}";`;

            connection.query(queryGetRoleID, (err, res) => {
              if (err) throw err;

              const queryUpdateEmpRole = `UPDATE employee SET role_id = ${res[0].id} WHERE id =${toUpdateID};`
              connection.query(queryUpdateEmpRole, (err, res) => {
                if (err) throw err;

                console.log("Updated role for the empployee")
                startMain();
              })
            })
          })
        })
      });
  });

}