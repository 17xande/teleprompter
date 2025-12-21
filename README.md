# teleprompter

An open source teleprompter running in your browser. What a time to be alive.

## TODO

- [x] Sticky clocks
- [x] Text scale adjustment
- [x] Keep pop content when refreshing pop
- [x] Keep pop link when refreshing pop
- [x] Keep prompter link when refreshing prompter (works by pressing Popup again)
- [x] Continuous deployment
- [x] Remove /html from path
- [x] Button to update pop content
- [x] Add control page text scale component
- [x] Prompt message
- [x] Keep prompter display settings on next open
- [x] Stop multiple clock cycles when multiple clock start button presses
- [x] Space bar scroll start/stop
- [x] On update content, scroll to same location
- [x] Red negative clock
- [x] Store and retrieve multiple documents
- [x] Change scroll speed progress control to a vertical scale control
- [x] Omit hours counter from countdown clock
- [ ] Add preview pane.

## Future

- [ ] Make interface pretty.
- [ ] Keep pop link when refreshing control page (for now, clicking POP again will relink and rerender)
- [ ] Keep clocks running when refreshing popup.
- [ ] Automatically invert dark text on paste
- [ ] Switch shoelace for webawesome.
- [ ] Keep prompter display position on screen after being moved (requires polling)
- [ ] Keyboard shortcuts
  - [ ] clocks
  - [ ] font colour
- [ ] Prompter preview render
- [ ] Rename project to "Prompter"?
- [ ] Prompter themes/layouts (CSS based)
- [ ] User accounts
- [ ] Saved documents
- [ ] Export document
- [ ] Import document
- [ ] Game controller

## Thoughts

### Rendering

Should I render the prompter in a canvas and then stream it to the prompter? Might have to do this anyway for the BMD integration. #future
