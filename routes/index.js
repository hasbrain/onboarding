import express from 'express'
import passport from 'passport'
import React from 'react'
import ReactDOM from 'react-dom/server'
import './auth'
import oauth2 from './oauth2'
import Login from '../views/containers/Login'
import Home from '../views/containers/Home'
import SignUp from '../views/containers/SignUp'
import jwt from 'jsonwebtoken'
import * as middlewares from './middlewares'

import * as user from './api/user'

const router = express.Router()

router.get('/', (req, res, next) => {
  const initialData = {
    error: req.flash('error')
  }
  res.render('index', {
    html: ReactDOM.renderToString(<Home data={initialData} />),
    data: JSON.stringify(initialData)
  })
})

router.get('/login', (req, res, next) => {
  const initialData = {
    error: req.flash('error')
  }
  res.render('index', {
    html: ReactDOM.renderToString(<Login data={initialData} />),
    data: JSON.stringify(initialData)
  })
})

router.get('/signup', (req, res, next) => {
  if (req.query.jwt) {
    jwt.verify(req.query.jwt, process.env.PRD_JWT_KEY, function (err, decoded) {
      if (err) return res.status(401).send('Invalid Token')
      const initialData = {
        error: req.flash('error'),
        userInfo: decoded
      }
      res.render('index', {
        html: ReactDOM.renderToString(<SignUp data={initialData} />),
        data: JSON.stringify(initialData)
      })
    })
  } else {
    return res.status(400).send('Missing Token')
  }
})

router.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})

router.post('/login', passport.authenticate('local', {
  successRedirect: '/admin',
  failureRedirect: '/login',
  failureFlash: true
}))

router.post('/api/v1/create_user', user.createUser)

router.post('/oauth/token', oauth2.token)
router.use('/api', passport.authenticate('bearer', { session: false }))
router.use('/admin', middlewares.ensureAuthorized)
router.use('/profiles', middlewares.ensureAuthenticated)

/* Github */
// router.get('/auth/github',
//   passport.authenticate('github', { scope: ['user:email', 'public_repo', 'read:org'] }))
router.get('/auth/github', (req, res) => {
  const scope = 'user:email public_repo read:org'
  const clientId = process.env.GITHUB_CLIENT_ID
  const redirectUri = encodeURIComponent(`${process.env.GITHUB_CALLBACK_URL}?r=${req.query.r || ''}`)
  res.redirect(`https://github.com/login/oauth/authorize?scope=${scope}&client_id=${clientId}&redirect_uri=${redirectUri}`)
})

router.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect(`/profiles/${req.user._id}/update`)
  })

router.get('/forum/:thread_id', (req, res) => {
  res.render('disqus', {
    threadId: req.params.thread_id
  })
})

export default router
