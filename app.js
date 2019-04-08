const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongooese = require('mongoose');
const bcrypt = require('bcryptjs');
const Event = require('./models/event');
const User = require('./models/user');

const app = express();
app.use(bodyParser.json());

app.use('/graphql', graphqlHttp({
    schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type User {
            _id: ID!
            email: String!
            password: String!
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        input UserInput {
            email: String!
            password: String!
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(event: EventInput): Event
            createUser(user: UserInput): User
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        events: () => {
            return Event.find()
            .then(events => {
                return events.map(event => {
                    return {...event._doc}
                })
            })
            .catch(err => {
                console.log(err)
                throw err
            })
        },
        createEvent: (args) => {
            const { title, description, price, date } = args.event;
            const event = new Event({
                title,
                description,
                price,
                date: new Date(date)
            })
            return event.save()
            .then(res => {
                console.log(res)
                return {...res._doc}
            })
            .catch(err => console.log(err))
        },
        createUser: (args) => {
            const { email, password } = args.user;
            return bcrypt.hash(password, 12)
            .then(hashedPass => {
                const user = new User({
                    email,
                    password: hashedPass
                })
                return user.save()
            })
            .then(res => {
                console.log(res)
                return {...res._doc}
            })
            .catch(err => console.log(err))
            
        }
    },
    graphiql: true
}))

mongooese.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-va4l9.mongodb.net/${process.env.MONGO_DB}?retryWrites=true`, { useNewUrlParser: true })
.then(() => {
    app.listen(3000, () => console.log('Server is listening to port 3000'));
    console.log('MONGO CONNECTED')
})
.catch((err) => console.log('ERROR', err))
