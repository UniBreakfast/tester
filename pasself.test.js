
const
  makeTest = require('./tester'),
  { assign, keys, values } = Object,
  c = console.log,
  { hash, compare } = require('bcryptjs'),

  dataDuck = {
    async addUser(login, hash) {
      this.addedUser = {login, hash}
      return 7
    },
    async user(ref) {
      this.requestedUser = ref
      return ref==13? null : userDuck
    },
    async updUser(id, props) {
      assign(userDuck, props)
      return true
    }
  },
  userDuck = {hash: '$2a$04$bbrFhxI7hw5CuDfqgX4FUu0HxD5PSiP3PI.vTNN.DXu2oA4z4B4e.'}

  passElf = require('.'),
  methods = 'reg, check, change'.split(', '),

  tests = setTimeout(async ()=> {
    await init()
    await reg(1)
    await check(1)
    await change(1)
  }, 100),

  init = makeTest("passElf module is supposed to be exporting an object with one method - a function .attach(dataElf), that supposed to initialize the passElf with a reference to a dataElf object and add the rest of the methods, also it supposed to return the passElf object itself", "and it does all that!",
    async (fail, crit)=> {

    const absent = []

    if (typeof passElf != 'object')
      fail("index.js doesn't export an object")

    if (keys(passElf).length != 1)
      fail("passElf object expected to have exactly one property at first")

    if (!passElf.attach || typeof passElf.attach != 'function')
      crit("there's no .attach(dataElf) method")
    else {
      if (passElf.attach.length != 1)
        fail("the .attach(dataElf) method supposed to expect one argument")

      if (await passElf.attach(dataDuck) != passElf)
        fail(".attach(dataElf) method supposed to return the same passElf object")

      methods.splice(0, methods.length,...methods.filter(m =>
        passElf[m] && typeof passElf[m] == 'function'? 1 : absent.push(m) && 0))
      if (absent.length)
        fail("passElf supposed to have methods: "+absent.join(', '))
    }
  }),

  reg = makeTest("passElf.reg(login, pass) is supposed to hash the password, add the new record to the users collection via dataElf.addUser(login, hash) and return the id of the record added.", "and it does all that!", async (fail, crit)=> {

    const login = 'Joe', pass = 'jeronimo',
          answer = await passElf.reg(login, pass)

    if (dataDuck.addedUser.login != login)
      crit("passElf.reg(login, pass) didn't call the dataElf.addUser(login, hash)")

    if (!compare(pass, dataDuck.addedUser.hash))
      fail("passElf.reg(login, pass) didn't hash the password correctly")

    if (answer != 7)
      fail("passElf.reg(login, pass) didn't return the answer of the dataElf.addUser(login, hash) call")
  }),

  check = makeTest("passElf.check(id | login, pass) is supposed to get the user's hash via dataElf.user(id | {login}).hash, check the pass against it and return true if it is correct, false if not or null if brute force suspected with the help of dataElf.updUser(id, {guess | last})", "and it does all that!", async (fail, crit, sleep)=> {

    const id = 3, login = 'Joe', pass = 'jeronimo',
          answer = await passElf.check(id, pass)

    if (dataDuck.requestedUser != 3)
      crit("passElf.check(id, pass) didn't call the dataElf.user(id)")

    await passElf.check(login, pass)

    if (dataDuck.requestedUser.login != login)
      fail("passElf.check(login, pass) didn't call the dataElf.user({login})")

    if (answer != true)
      fail("passElf.check(id | login, pass) didn't return true on correct pass")

    if (await passElf.check(id, 'wrong') !== false)
      fail("passElf.check(id | login, pass) didn't return false on incorrect pass")

    if (await passElf.check(13, pass) !== false)
      fail("passElf.check(id | login, pass) didn't return false on incorrect id | login")

    await passElf.check(id, 'wrong')
    await passElf.check(id, 'wrong')
    passElf.check(id, 'wrong') && await sleep(10)

    if (userDuck.guess != 3)
      fail("passElf.check(id | login, pass) didn't update the sequential guess cound on the user")

    if (userDuck.last < Date.now()-50 || userDuck.last > Date.now())
      fail("passElf.check(id | login, pass) didn't update the last guess timestamp on the user correctly")

    if (await passElf.check(id, pass) !== null)
      fail("passElf.check(id | login, pass) didn't return null if it's necessary to wait after three checks")
  }),

  change = makeTest("passElf.change(id | login, pass) is supposed to hash the password and replace the old hash with the new one via dataElf.updUser(id | {login}, {hash}). It should return its returned value.", "and it does all that!", async (fail, crit)=> {

    const id = 3, pass = 'jeronimo',
          answer = await passElf.change(id, pass)

    if (userDuck.hash == '$2a$04$bbrFhxI7hw5CuDfqgX4FUu0HxD5PSiP3PI.vTNN.DXu2oA4z4B4e.')
      crit("passElf.change(id | login, pass) didn't call the dataElf.updUser(id | {login}, {hash}) to replace the hash with the new one'")

    if (!compare('jeronimo', userDuck.hash))
      fail("passElf.change(id | login, pass) didn't hash the password correctly'")

    if (answer !== true)
      fail("passElf.change(id | login, pass) didn't return the value returned by the dataElf.updUser(id | {login}, {hash})'")
  })
