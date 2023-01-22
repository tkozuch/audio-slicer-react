import { slowCypressDown } from "cypress-slow-down";

// slowCypressDown(400);

describe("cypress test", () => {
  it("can load a file", () => {
    cy.viewport(1338, 977);

    cy.visit("http://localhost:3000/");

    cy.get("#upload").click();

    cy.get("#upload").selectFile(".\\audio test.wav");
  });
  it("can draw and select frames. frames don't overlap each other", () => {
    cy.viewport(1338, 977);

    cy.visit("http://localhost:3000/");

    cy.get("#upload").click();

    cy.get("#upload").selectFile(".\\audio test.wav");

    // cy.pause();

    // cy.get("#mark-btn").to.have.class("selected");

    // Draw first frame
    cy.get("#framesContainer").trigger("mousedown", 15, 30);
    cy.get("#framesContainer").trigger("mousemove", 300, 50);
    cy.get("#framesContainer").trigger("mouseup");

    // Draw second frame
    cy.get("#framesContainer").trigger("mousedown", 700, 30); // this tests we can draw also from left to right
    cy.get("#framesContainer").trigger("mousemove", 600, 50);
    cy.get("#framesContainer").trigger("mouseup");
    cy.get(".frame:nth-child(2)").should("not.have.class", "selected"); // assert the frames is NOT automatically selected after being drawn, this is for a nicer UX

    // Draw third frame
    cy.get("#framesContainer").trigger("mousedown", 450, 30); //start between frame 1 and 2
    cy.get("#framesContainer").trigger("mousemove", 750, 50); //finish after frame 2
    cy.get("#framesContainer").trigger("mouseup");

    // Draw fourth frame
    cy.get("#framesContainer").trigger("mousedown", 400, 30); //start between frame 1 and 3
    cy.get("#framesContainer").trigger("mousemove", 250, 50); //finish within frame 1
    cy.get("#framesContainer").trigger("mouseup");
    // cy.pause();
    // This tests whether the frames are created, and whether the 2 that were created in between
    // don't overlap between the first 2 created, even though the moused was moved further
    cy.get(".frame:nth-child(1)").invoke("outerWidth").should("be.eq", 285);
    cy.get(".frame:nth-child(2)").invoke("outerWidth").should("be.eq", 100);
    cy.get(".frame:nth-child(3)").invoke("outerWidth").should("be.eq", 150); // normally the width would be 300
    cy.get(".frame:nth-child(4)").invoke("outerWidth").should("be.eq", 100); // normally the width would be 150

    // Test frames are not selected by default
    cy.get(".frame:nth-child(1)").should("not.have.class", "selected");
    cy.get(".frame:nth-child(2)").should("not.have.class", "selected");
    cy.get(".frame:nth-child(3)").should("not.have.class", "selected");

    // cy.pause();
    // Test clicking on a frame selects it
    cy.get(".frame:nth-child(2)").click();
    cy.get(".frame:nth-child(2)").should("have.class", "selected");
    cy.get(".frame:nth-child(3)").click();
    cy.get(".frame:nth-child(3)").should("have.class", "selected");
    cy.get(".frame:nth-child(2)").should("not.have.class", "selected");
  });
});
//# recorderSourceMap=BCCECGCICKCMCOCQCSCUCWCYCaCcCeCgBCiBCkBCmBCoBCqBCsBCuBAuBAuBAuBAuBCwBCyBC0BC2BC4BC6BC8BC+BCgCCiCCkCCmCCoCCqCCsCCuCCwCC
