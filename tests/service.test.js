const request = require('supertest')
const app = require('../index')
describe('News endpoint', () => {
  it('should respond 200', async () => {
    const res = await request(app)
      .get('/');
    expect(res.statusCode).toEqual(200);
  });

  it('should respond msg SUCCESS', async () => {
    const res = await request(app)
      .get('/');
      expect(res.body.msg).toBe('SUCCESS');
  })

  it('should respond more than 2 news', async () => {
    const res = await request(app)
      .get('/');
      expect(res.body.data.news.length).toBeGreaterThan(2);
  })

})
