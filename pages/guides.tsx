import { NextPage } from 'next';
import Layout from '@/layout';
import BothTitles from "@/components/BothTitles";

const Guides: NextPage = () => {
  return (
    <Layout>      
      <div className='guides-bg'>
        <h1 className="">FF4 Ultima Guides</h1>
          <BothTitles />
        <h3>Guides written by Lily 420 69 😎 of Team Ultima</h3>
        <ul>
        	<li>
			    <a target="_blank" href="https://docs.google.com/document/d/1O77TDKTG1dWDrHaT40NECik6Cz3rtYmUoazxTQPxnIY/edit?tab=t.0">
				    <h3>FF4U Commands Guide</h3>
			    </a>
			</li>
			<li>
				<a target="_blank" href="https://docs.google.com/document/d/1Z4O08DPN0JhQ4E0d2wbQYOZM4n814V5DyhyWqTVPSkM/edit?usp=sharing">
					<h3>FF4U Overall Guide</h3>
				</a>
			</li>
			<li>
				<a target="_blank" href="https://docs.google.com/spreadsheets/d/19IU_ccvRXbx7BrihScF6c0JQ-7mFVNQR96KukOGrXkU/edit?gid=589265229#gid=589265229">
					<h3>FF4U Boss Guide</h3>
				</a>
			</li>
			<li>
				<a target="_blank" href="https://docs.google.com/spreadsheets/d/1NDR7HuKJXEq6X0EsmXlQ52uE9wctkn9qvZKSTYc9bcI/edit?gid=0#gid=0">
					<h3>FF4U Drop/Steal Table</h3>
				</a>
			</li>
			<li>
			    <a target="_blank" href="https://docs.google.com/spreadsheets/d/1gxxapWwliJwzvp8TSYJL2qRT3vvJhZciRpN0bXcEDFU/edit?gid=40660744#gid=40660744">
				    <h3>FF4U Item Checklist</h3>
			    </a>
		    </li>
        </ul>
		<h4>Maps charted by Boomerang</h4>
		<ul>
			<li>
				<a target="_blank" href="/overworldmap">
					<h3>
						Overworld Map
					</h3>
				</a>
			</li>
			<li>
				<a target="_blank" href="/underworldmap">
					<h3>
						Underworld Map
					</h3>
				</a>
			</li>
			<li>
				<a target="_blank" href="/lunarmap">
					<h3>
						Lunar Map
					</h3>
				</a>
			</li>
		</ul>
		<h4>Bestiary Omissions</h4>
		<ul>
			<li>The 4 Fiends fight in the Giant</li>
			<li>The Golbez fought by Tellah in his cutscene</li>
			<li>The waterhag Edward fights solo (called ?)</li>
			<li>The Titan summoned by Rydia at the beginning</li>
			<li>The shadow dragon summoned by Golbez</li>
			<li>Dark Elf when you show up WITHOUT Whisperweed</li>
			<li>The Zeromus fought by Golbez & FuSoYa in the cutscene at the end</li>
		</ul>
		<h4>Rom Offsets for Sprite Hacking</h4>
		<ul>
			<li>
				<a target="_blank" href="/ff4u-hero-offsets.json">
					<h3>
						Cecil, Kain, Rosa, Rydia/Kydia,<br/>Edge, Yang, Edward,<br/>Palom, Porom, Edward,<br/>Tellah, Cid, FuSoYa
					</h3>
				</a>
			</li>
			<li>
				<a target="_blank" href="/ff4u-extra-offsets.json">
					<h3>
						Golbez & Anna
					</h3>
				</a>
			</li>
		</ul>
      </div>
    </Layout>
  );
};

export default Guides;