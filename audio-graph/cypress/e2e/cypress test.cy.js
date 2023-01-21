describe("cypress test", () => {
  it("tests cypress test", () => {
    cy.viewport(1338, 977);

    cy.visit("http://localhost:3000/");

    cy.get("#upload").click();

    cy.get("#upload").selectFile(".\\audio test.wav");

    cy.get("#delete-btn").click();

    cy.get("#mark-btn").click();

    cy.get("#framesContainer").trigger("mousedown", 15, 40);

    cy.get("#framesContainer").trigger("mousemove", 300, 60);

    cy.get("#framesContainer").trigger("mouseup");

    cy.get("#framesContainer").click();

    cy.get("#framesContainer").click();

    cy.get("#playBtn").click();

    cy.get("#framesContainer > div:nth-child(4)").click();

    cy.get("#framesContainer").click();

    cy.get("#framesContainer > div:nth-child(4)").click();

    cy.get("#framesContainer > div:nth-child(3)").click();

    cy.get("#framesContainer > div:nth-child(4)").click();

    cy.get("#framesContainer > div:nth-child(4)").click();

    cy.get("#framesContainer > div:nth-child(4)").click();

    cy.get("#framesContainer > div:nth-child(4)").click();

    cy.get("#framesContainer > div:nth-child(4)").click();

    cy.get("#framesContainer > div:nth-child(4)").click();

    cy.get("#framesContainer > div.frame.selected").dblclick();

    cy.get("#delete-btn").click();

    cy.get("#framesContainer > div:nth-child(13)").click();

    cy.get("#framesContainer > div:nth-child(13)").click();

    cy.get("#framesContainer > div:nth-child(4)").dblclick();

    cy.get("#framesContainer > div:nth-child(4)").click();

    cy.get("#framesContainer > div:nth-child(13)").click();

    cy.get("#framesContainer > div:nth-child(13)").dblclick();

    cy.get("#framesContainer > div:nth-child(4)").click();

    cy.get("#framesContainer > div:nth-child(13)").click();

    cy.get("#framesContainer > div:nth-child(13)").dblclick();

    cy.get("#framesContainer > div:nth-child(4)").click();

    cy.get("#framesContainer > div:nth-child(4)").dblclick();

    cy.get("#framesContainer > div:nth-child(4)").dblclick();

    cy.get("#framesContainer > div:nth-child(4)").click();

    cy.get("#framesContainer > div:nth-child(4)").dblclick();

    cy.get("#framesContainer > div:nth-child(4)").click();

    cy.get("#framesContainer > div:nth-child(4)").click();

    cy.get("#framesContainer > div:nth-child(4)").click();
  });
});
//# recorderSourceMap=BCCECGCICKCMCOCQCSCUCWCYCaCcCeCgBCiBCkBCmBCoBCqBCsBCuBAuBAuBAuBAuBCwBCyBC0BC2BC4BC6BC8BC+BCgCCiCCkCCmCCoCCqCCsCCuCCwCC
