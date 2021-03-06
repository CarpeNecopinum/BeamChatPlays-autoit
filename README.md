# BeamChatPlays
Beam Interactive App

this is based on https://github.com/Firebottle/BeamChatPlays but uses autoit to send keystrokes, which improves compatibility with some games.

Description: <br>
IN PROGRESS <br>
This app allows you to quickly set up interactive by adding buttons to a json file.<br>

## Original Install Notes: <br>
1. Download Node.js https://nodejs.org/en/ <br>
2. Download this repo and extract the files somewhere. <br>
3. Open up node and direct it to the folder you just extracted. <br>
4. Type in "npm install" and wait for it to finish. <br>
5. Go to beam.pro and set up your interactive board with the buttons and control you need for your game. <br>
6. Once done, make sure the board is active on your beam.pro channel. <br>
7. Now, go back to the folder for this app that you unzipped and open up the settings folder. <br>
8. Edit auth.json with your beam information. <br>
9. Next go back to the root folder and go to the controls folder. <br>
10. Open up current.json and add in an entry for all of your buttons. See example.json for help. <br>
11. Save the file and go back to the node.js window. <br>
12. Type node app.js <br>
13. Interactive should now be working! <br>

## Special Steps for the AutoIt version:

1. the "npm install" step will probably fail due to python missing. Install Python 2.7 (not 3!) from https://www.python.org/downloads/ then type "npm config set python C:\<whereYourPythonIs>\python.exe" with the path you installed python to. Then run "npm install" again.
2. Due to this not using robotjs, but autoit for key strokes, the key names in the current.json file have to look differently, see https://www.autoitscript.com/autoit3/docs/appendix/SendKeys.htm for reference.

## Voting Functionality:

The entries in your current.json can now have a `group` entry.

Buttons assigned to the same group can not be tapped/held simultaneously, people pressing buttons of this group "vote" for their button, the button with the most votes is tapped/held.

Possible scenario: Trolls keep releasing your Pokemon.

Solved by voting: Add ALL buttons to the same group, set the reporting interval in your beam game configuration relatively high. Now the trolls need a majority to release your Pokemon (my condolences when they still do).


## Button Notes: <br>
- When setting up buttons on beam.pro make sure to check either "holding" or Frequency".<br>
- If you want global cooldowns on buttons, leave the cooldown on beam.pro at 0 and edit the cooldown in the controls for this app. If you want individual cooldowns, do the opposite.<br>

## Screen Control Notes: <br>
- This does support screen controls. Just add screen controls to your board at beam.pro.<br>
- While interactive allows people to build something that will click your mouse, this app does NOT do that. This is on purpose for safety reasons. (This means people can't aim and shoot with the mouse controls. Sorry!)<br>
- Seeing as how people will be moving your mouse, you may find it hard to take back control. The easiest way to do this is to ALT + Tab back to the node window and hit CTRL + C until it stops.<br>

## Joystick Control Notes: <br>
- This does support the joystick. Just add the joystick to your board at beam.pro.<br>
- Seeing as how people will be moving your mouse, you may find it hard to take back control. The easiest way to do this is to ALT + Tab back to the node window and hit CTRL + C until it stops.<br>
