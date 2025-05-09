import { NextPage } from 'next';
import Layout from '@/layout';
import BothTitles from "@/components/BothTitles";

const Discord: NextPage = () => {
  return (
    <Layout>      
      <div className='guides-bg'>
        <h1 className="">FF4 Ultima Guides</h1>
          <BothTitles />
        <h3>Guides written by LilyNo3 of Team Ultima</h3>
        <ul>
          <li>
			      <a target="_blank" href="https://docs.google.com/document/d/1O77TDKTG1dWDrHaT40NECik6Cz3rtYmUoazxTQPxnIY/edit?tab=t.0">
				      FF4U Commands Guide
			      </a>
		      </li>
		      <li>
			      <a target="_blank" href="https://docs.google.com/document/d/1Z4O08DPN0JhQ4E0d2wbQYOZM4n814V5DyhyWqTVPSkM/edit?usp=sharing">
				      FF4U Overall Guide
			      </a>
		      </li>
		      <li>
			      <a target="_blank" href="https://docs.google.com/spreadsheets/d/19IU_ccvRXbx7BrihScF6c0JQ-7mFVNQR96KukOGrXkU/edit?gid=589265229#gid=589265229">
				      FF4U Boss Guide 
			      </a>
		      </li>
		      <li>
			      <a target="_blank" href="https://docs.google.com/spreadsheets/d/1NDR7HuKJXEq6X0EsmXlQ52uE9wctkn9qvZKSTYc9bcI/edit?gid=0#gid=0">
				      FF4U Drop/Steal Table
			      </a>
		      </li>
		      <li>
			      <a target="_blank" href="https://docs.google.com/spreadsheets/d/1gxxapWwliJwzvp8TSYJL2qRT3vvJhZciRpN0bXcEDFU/edit?gid=40660744#gid=40660744">
				      FF4U Item Checklist
			      </a>
		      </li>
        </ul>
      </div>
    </Layout>
  );
};

export default Discord;