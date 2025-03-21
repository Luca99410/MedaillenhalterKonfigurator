import React from "react";
import "./About.css";
import medalHolderImage from "../img/about.jpg";

const About = () => {
  return (
    <div className="about-container">
      <div className="about-image">
        <img src={medalHolderImage} alt="Medaille Halter aus Edelstahl" />
      </div>
      <div className="about-content">
        <h1>Mein selbst entworfener Medaillenhalter</h1>
        <p>
          Während der Corona-Zeit waren alle Sportveranstaltungen abgesagt. Gerade in 2020 wollte
          ich richtig durchstarten und hatte mich für einige Laufveranstaltungen angemeldet - jedoch
          wurden die meisten aufgrund des Corona-Virus abgesagt. Mir blieb nur noch die Möglichkeit
          zuhause "virtuell" die Distanz jeder Strecken nachzulaufen und bekam viele Medaillen der
          jeweiligen Veranstaltungen zugeschickt. Die Distanzen zuhause zu laufen war aber kein 
          Vergleich zu den stimmungsvollen Veranstaltungen mit hunderten hochmotivierten Mitläufern.
          </p>
          <p>
          Ich schaute daher mit Sehnsucht auf meine Medaillen und wünschte mir wieder an Wettkämpfen 
          teilzunehmen. Um meine Motivation hochzuhalten, beschloss ich, einen eigenen Medaillenhalter
           zu entwerfen.
        </p>
        <p>
          Mit einem CAD-Programm erstellte ich das Design, das einige meiner bisherigen Medaillen 
          stilvoll präsentieren sollte. Nachdem ich den Entwurf perfektioniert hatte, ließ ich 
          den Halter aus Edelstahl lasern. Das fertige Stück ist knapp 1 Meter breit und hängt nun 
          stolz an meiner Wand – eine Erinnerung an vergangene Erfolge und eine Motivation für 
          zukünftige Wettkämpfe.
        </p>
      </div>
    </div>
  );
};

export default About;
