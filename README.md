# siege-tactics

Siege is hella missing features. Being that it's a competative shooter, it is important to know each map to understand where to go and what to do. But what if you dont know the maps, or you play with players that may not understand what to do or where to go? 

This webapp allows you to create a lobby with your friends and gives you a top down view of of each map, and collaboratively draw!

# can i use it?

no. the live build broke and i stopped playing r6 :/

but you can still clone and set it up yourself!

## features

- create a lobby for you and your friends to join
- select a map to think of strats on
- change the floor map of each map
- DRAW TOGETHER!

## issues

drawing area is blank when the floor map is changed
  - i dont account for floors less than 1 and greater than the amount of floors for each map

the site crashed :(
  - the issue for this is having the socket state for each room not properly sync with the client. if another user creates a new room sometimes the state for that room is not set to default, but instead the previous state of the last room created, therefore it does not know what map to load 😢

## currently working on...

- fixing issues above because they are apart of the backbone of the website
- add colours to each user for when they draw
- add bootstrap components to the site to make it prettier

## the future
- make rooms password protected, and have a list of lobbies to join
- add different kinds of markers for the user to drag onto the map


# come help me out

## to run
clone or fork this repo, make sure `concurrently` is installed (`npm install --global concurrently`)

`npm install` in root

`cd client && npm install` for client dependencies

run `npm run dev`
